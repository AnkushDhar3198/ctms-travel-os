package com.ctms.service;

import com.ctms.dto.ExpenseDTO;
import com.ctms.entity.Expense;
import com.ctms.entity.TripRequest;
import com.ctms.entity.enums.ExpenseStatus;
import com.ctms.entity.enums.TripStatus;
import com.ctms.exception.ResourceNotFoundException;
import com.ctms.repository.ExpenseRepository;
import com.ctms.repository.TripRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final TripRequestRepository tripRequestRepository;

    /**
     * Upload a new expense for an active trip.
     */
    @Transactional
    public ExpenseDTO uploadExpense(ExpenseDTO dto) {
        TripRequest trip = tripRequestRepository.findById(dto.getTripId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found."));

        if (trip.getStatus() != TripStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Expenses can only be uploaded for active trips."
            );
        }

        Expense expense = Expense.builder()
                .tripRequest(trip)
                .fileUrl(dto.getFileUrl())
                .fileName(dto.getFileName())
                .amount(dto.getAmount())
                .description(dto.getDescription())
                .status(ExpenseStatus.PENDING)
                .build();

        Expense saved = expenseRepository.save(expense);
        log.info("Expense {} uploaded for trip {}", saved.getId(), dto.getTripId());

        return toDTO(saved);
    }

    /**
     * Get all expenses for a specific trip.
     */
    public List<ExpenseDTO> getExpensesByTrip(Long tripId) {
        return expenseRepository.findByTripRequestId(tripId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all pending expenses (for Finance dashboard).
     */
    public List<ExpenseDTO> getPendingExpenses() {
        return expenseRepository.findByStatus(ExpenseStatus.PENDING)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Credit an expense (Finance team action).
     */
    @Transactional
    public ExpenseDTO creditExpense(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found."));

        if (expense.getStatus() == ExpenseStatus.CREDITED) {
            throw new IllegalStateException("This expense has already been credited.");
        }

        expense.setStatus(ExpenseStatus.CREDITED);
        expense.setCreditedAt(LocalDateTime.now());
        expenseRepository.save(expense);

        log.info("Expense {} credited", expenseId);
        return toDTO(expense);
    }

    private ExpenseDTO toDTO(Expense e) {
        return ExpenseDTO.builder()
                .id(e.getId())
                .tripId(e.getTripRequest().getId())
                .fileUrl(e.getFileUrl())
                .fileName(e.getFileName())
                .amount(e.getAmount())
                .description(e.getDescription())
                .status(e.getStatus().name())
                .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null)
                .creditedAt(e.getCreditedAt() != null ? e.getCreditedAt().toString() : null)
                .build();
    }
}
