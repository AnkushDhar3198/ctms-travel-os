package com.ctms.service;

import com.ctms.entity.TripRequest;
import com.ctms.entity.User;
import com.ctms.entity.enums.TripStatus;
import com.ctms.exception.ValidationException;
import com.ctms.repository.TripRequestRepository;
import com.ctms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Step 2 of Workflow: Automatic system validation.
 * Runs 5 sequential checks before forwarding to manager.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AutoValidationService {

    private final UserRepository userRepository;
    private final TripRequestRepository tripRequestRepository;

    // Simulated budget limit for validation
    private static final BigDecimal MAX_BUDGET_LIMIT = new BigDecimal("500000.00");

    // Known valid project prefixes (in production, this queries a project database)
    private static final String[] VALID_PROJECT_PREFIXES = {"PRJ", "PROJ", "P-"};

    // Known valid client prefixes (in production, this queries a client database)
    private static final String[] VALID_CLIENT_PREFIXES = {"CLI", "CL-", "C-"};

    /**
     * Executes all 5 validation checks on a new trip request.
     * If all pass: status → PENDING_MANAGER
     * If any fail: status → REJECTED_SYSTEM with reason
     */
    public void validateNewRequest(TripRequest request) {
        try {
            checkEmployeeStatus(request);
            validateProject(request);
            validateClient(request);
            checkBudgetLimit(request);
            verifyMandatoryFields(request);

            // All checks passed
            request.setStatus(TripStatus.PENDING_MANAGER);
            tripRequestRepository.save(request);
            log.info("Trip request {} passed auto-validation, forwarded to manager", request.getId());

        } catch (ValidationException ex) {
            // Validation failed — mark as system-rejected
            request.setStatus(TripStatus.REJECTED_SYSTEM);
            request.setRejectionReason(ex.getMessage());
            tripRequestRepository.save(request);
            log.warn("Trip request {} failed auto-validation: {}", request.getId(), ex.getMessage());
            throw ex;
        }
    }

    /**
     * Check 1: Is the employee currently active?
     */
    private void checkEmployeeStatus(TripRequest request) {
        User employee = request.getEmployee();
        if (employee == null) {
            throw new ValidationException(
                    "Employee record not found. The request cannot be processed."
            );
        }
        if (!employee.getIsActive()) {
            throw new ValidationException(
                    "Your employee account is currently inactive. Active status is required to raise travel requests."
            );
        }
    }

    /**
     * Check 2: Does the specified project exist?
     * In production, this would query a project management database.
     */
    private void validateProject(TripRequest request) {
        String projectNo = request.getProjectNo();
        if (projectNo == null || projectNo.isBlank()) {
            throw new ValidationException(
                    "A valid project number is required for this travel request."
            );
        }

        boolean isValid = false;
        for (String prefix : VALID_PROJECT_PREFIXES) {
            if (projectNo.toUpperCase().startsWith(prefix)) {
                isValid = true;
                break;
            }
        }

        if (!isValid) {
            throw new ValidationException(
                    "The project number '" + projectNo + "' could not be verified in our system. " +
                    "Please ensure the project is registered and active."
            );
        }
    }

    /**
     * Check 3: Is it a valid client?
     * In production, this would query a CRM system.
     */
    private void validateClient(TripRequest request) {
        String clientId = request.getClientId();
        if (clientId == null || clientId.isBlank()) {
            throw new ValidationException(
                    "A valid client ID is required for this travel request."
            );
        }

        boolean isValid = false;
        for (String prefix : VALID_CLIENT_PREFIXES) {
            if (clientId.toUpperCase().startsWith(prefix)) {
                isValid = true;
                break;
            }
        }

        if (!isValid) {
            throw new ValidationException(
                    "The client ID '" + clientId + "' could not be verified. " +
                    "Please ensure the client is onboarded in our system."
            );
        }
    }

    /**
     * Check 4: Is the required budget available / within limits?
     */
    private void checkBudgetLimit(TripRequest request) {
        BigDecimal cost = request.getEstimatedCost();
        if (cost != null && cost.compareTo(MAX_BUDGET_LIMIT) > 0) {
            throw new ValidationException(
                    "The estimated cost of ₹" + cost.toPlainString() +
                    " exceeds the maximum allowed budget of ₹" + MAX_BUDGET_LIMIT.toPlainString() +
                    ". Please revise your estimate or contact your manager."
            );
        }
    }

    /**
     * Check 5: Are all mandatory details present?
     */
    private void verifyMandatoryFields(TripRequest request) {
        StringBuilder missing = new StringBuilder();

        if (request.getDestination() == null || request.getDestination().isBlank()) {
            missing.append("Destination, ");
        }
        if (request.getStartDate() == null) {
            missing.append("Start Date, ");
        }
        if (request.getEndDate() == null) {
            missing.append("End Date, ");
        }
        if (request.getStartDate() != null && request.getEndDate() != null
                && request.getStartDate().isAfter(request.getEndDate())) {
            throw new ValidationException(
                    "The start date cannot be after the end date. Please correct your travel dates."
            );
        }

        if (!missing.isEmpty()) {
            String fields = missing.substring(0, missing.length() - 2);
            throw new ValidationException(
                    "The following mandatory fields are missing: " + fields +
                    ". Please complete all required information."
            );
        }
    }
}
