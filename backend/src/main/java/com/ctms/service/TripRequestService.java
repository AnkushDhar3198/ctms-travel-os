package com.ctms.service;

import com.ctms.dto.ApprovalRequest;
import com.ctms.dto.TripRequestDTO;
import com.ctms.dto.TripMilestoneDTO;
import com.ctms.dto.ItineraryDTO;
import com.ctms.entity.*;
import com.ctms.entity.enums.TripStatus;
import com.ctms.exception.ResourceNotFoundException;
import com.ctms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TripRequestService {

    private final TripRequestRepository tripRequestRepository;
    private final UserRepository userRepository;
    private final TripMilestonesRepository milestonesRepository;
    private final AutoValidationService autoValidationService;

    /**
     * Create a new trip request and run auto-validation.
     */
    @Transactional
    public TripRequestDTO createTripRequest(TripRequestDTO dto, Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found."));

        // Check if employee already has an active trip
        long activeCount = tripRequestRepository.countByEmployeeIdAndStatus(employeeId, TripStatus.ACTIVE);
        if (activeCount > 0) {
            throw new IllegalStateException(
                    "You already have an active trip. Only one active trip is allowed at a time."
            );
        }

        TripRequest request = TripRequest.builder()
                .employee(employee)
                .projectNo(dto.getProjectNo())
                .clientId(dto.getClientId())
                .destination(dto.getDestination())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .estimatedCost(dto.getEstimatedCost())
                .needsFlight(dto.getNeedsFlight() != null ? dto.getNeedsFlight() : false)
                .needsHotel(dto.getNeedsHotel() != null ? dto.getNeedsHotel() : false)
                .needsCab(dto.getNeedsCab() != null ? dto.getNeedsCab() : false)
                .extraLuggageKg(dto.getExtraLuggageKg())
                .status(TripStatus.PENDING_AUTO_VAL)
                .build();

        TripRequest saved = tripRequestRepository.save(request);
        log.info("Trip request {} created by employee {}", saved.getId(), employeeId);

        // Run auto-validation (Step 2)
        autoValidationService.validateNewRequest(saved);

        return toDTO(saved);
    }

    /**
     * Get all trips for an employee.
     */
    public List<TripRequestDTO> getTripsForEmployee(Long employeeId) {
        return tripRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get trips by status (for manager, travel desk, etc.)
     */
    public List<TripRequestDTO> getTripsByStatus(TripStatus status) {
        return tripRequestRepository.findByStatus(status)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all pending requests for manager review.
     */
    public List<TripRequestDTO> getPendingManagerRequests() {
        return getTripsByStatus(TripStatus.PENDING_MANAGER);
    }

    /**
     * Get all approved requests for travel desk.
     */
    public List<TripRequestDTO> getApprovedRequests() {
        return getTripsByStatus(TripStatus.APPROVED);
    }

    /**
     * Get all active trips.
     */
    public List<TripRequestDTO> getActiveTrips() {
        return getTripsByStatus(TripStatus.ACTIVE);
    }

    /**
     * Get all trips (admin view).
     */
    public List<TripRequestDTO> getAllTrips() {
        return tripRequestRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Manager approves a trip request.
     */
    @Transactional
    public TripRequestDTO approveRequest(Long tripId, ApprovalRequest approval) {
        TripRequest trip = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip request not found."));

        if (trip.getStatus() != TripStatus.PENDING_MANAGER) {
            throw new IllegalStateException(
                    "This request cannot be approved. Current status: " + trip.getStatus().name()
            );
        }

        trip.setStatus(TripStatus.APPROVED);
        trip.setRemarks(approval.getRemarks());

        tripRequestRepository.save(trip);
        log.info("Trip {} approved by manager", tripId);

        return toDTO(trip);
    }

    /**
     * Manager rejects a trip request.
     */
    @Transactional
    public TripRequestDTO rejectRequest(Long tripId, String reason) {
        TripRequest trip = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip request not found."));

        if (trip.getStatus() != TripStatus.PENDING_MANAGER) {
            throw new IllegalStateException(
                    "This request cannot be rejected. Current status: " + trip.getStatus().name()
            );
        }

        trip.setStatus(TripStatus.REJECTED);
        trip.setRejectionReason(reason);

        tripRequestRepository.save(trip);
        log.info("Trip {} rejected by manager", tripId);

        return toDTO(trip);
    }

    /**
     * Get a single trip by ID.
     */
    public TripRequestDTO getTripById(Long tripId) {
        TripRequest trip = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip request not found."));
        return toDTO(trip);
    }

    private TripRequestDTO toDTO(TripRequest r) {
        TripRequestDTO dto = TripRequestDTO.builder()
                .id(r.getId())
                .projectNo(r.getProjectNo())
                .clientId(r.getClientId())
                .destination(r.getDestination())
                .startDate(r.getStartDate())
                .endDate(r.getEndDate())
                .estimatedCost(r.getEstimatedCost())
                .needsFlight(r.getNeedsFlight())
                .needsHotel(r.getNeedsHotel())
                .needsCab(r.getNeedsCab())
                .extraLuggageKg(r.getExtraLuggageKg())
                .status(r.getStatus().name())
                .remarks(r.getRemarks())
                .rejectionReason(r.getRejectionReason())
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null)
                .updatedAt(r.getUpdatedAt() != null ? r.getUpdatedAt().toString() : null)
                .build();

        if (r.getEmployee() != null) {
            dto.setEmployeeName(r.getEmployee().getName());
            dto.setEmployeeEmpId(r.getEmployee().getEmpId());
        }

        // Attach itinerary if present
        if (r.getItinerary() != null) {
            TripItinerary it = r.getItinerary();
            dto.setItinerary(ItineraryDTO.builder()
                    .tripId(r.getId())
                    .pnr(it.getPnr())
                    .flightDetails(it.getFlightDetails())
                    .cabDriverName(it.getCabDriverName())
                    .cabNumber(it.getCabNumber())
                    .cabDetails(it.getCabDetails())
                    .hotelName(it.getHotelName())
                    .hotelAddress(it.getHotelAddress())
                    .hotelDetails(it.getHotelDetails())
                    .allocatedAssets(it.getAllocatedAssets())
                    .assetsReturned(it.getAssetsReturned())
                    .build());
        }

        // Attach milestones if present
        if (r.getMilestones() != null) {
            TripMilestones m = r.getMilestones();
            dto.setMilestones(TripMilestoneDTO.builder()
                    .tripId(r.getId())
                    .flightBoarded(m.getFlightBoarded())
                    .flightLanded(m.getFlightLanded())
                    .cabPickedUp(m.getCabPickedUp())
                    .hotelCheckedIn(m.getHotelCheckedIn())
                    .hotelCheckedOut(m.getHotelCheckedOut())
                    .returnFlightBoarded(m.getReturnFlightBoarded())
                    .journeyEnded(m.getJourneyEnded())
                    .updatedAt(m.getUpdatedAt() != null ? m.getUpdatedAt().toString() : null)
                    .build());
        }

        return dto;
    }
}
