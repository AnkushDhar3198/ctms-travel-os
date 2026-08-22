package com.ctms.service;

import com.ctms.dto.ApprovalRequest;
import com.ctms.dto.ChecklistTimelineDTO;
import com.ctms.dto.ItineraryDTO;
import com.ctms.dto.TripMilestoneDTO;
import com.ctms.dto.TripRequestDTO;
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
    private final TripItineraryRepository itineraryRepository;
    private final TripChecklistTimelineRepository timelineRepository;
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

        // Validate date chronology
        if (dto.getStartDate() != null && dto.getEndDate() != null && dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date.");
        }

        TripRequest request = TripRequest.builder()
                .employee(employee)
                .projectNo(dto.getProjectNo() != null ? dto.getProjectNo().trim() : null)
                .clientId(dto.getClientId() != null ? dto.getClientId().trim() : null)
                .destination(dto.getDestination() != null ? dto.getDestination().trim() : null)
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
        try {
            autoValidationService.validateNewRequest(saved);
        } catch (Exception ex) {
            log.warn("Trip request {} auto-validation notice: {}", saved.getId(), ex.getMessage());
        }

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
        return tripRequestRepository.findByStatusOrderByCreatedAtDesc(status)
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
        return tripRequestRepository.findAllByOrderByCreatedAtDesc()
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

        // Save allocated assets into itinerary if provided by manager
        if (approval.getAllocatedAssets() != null && !approval.getAllocatedAssets().isBlank()) {
            TripItinerary itinerary = itineraryRepository.findByTripRequestId(tripId)
                    .orElse(TripItinerary.builder().tripRequest(trip).build());
            itinerary.setAllocatedAssets(approval.getAllocatedAssets().trim());
            itineraryRepository.save(itinerary);
            trip.setItinerary(itinerary);
        }

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

        // Attach itinerary - query repository if not loaded on parent object
        TripItinerary it = (r.getItinerary() != null) ? r.getItinerary() : itineraryRepository.findByTripRequestId(r.getId()).orElse(null);
        if (it != null) {
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

        // Attach milestones - query repository if not loaded on parent object
        TripMilestones m = (r.getMilestones() != null) ? r.getMilestones() : milestonesRepository.findByTripRequestId(r.getId()).orElse(null);
        if (m != null) {
            TripMilestoneDTO milestoneDTO = TripMilestoneDTO.builder()
                    .tripId(r.getId())
                    .flightBoarded(m.getFlightBoarded())
                    .flightLanded(m.getFlightLanded())
                    .cabPickedUp(m.getCabPickedUp())
                    .hotelCheckedIn(m.getHotelCheckedIn())
                    .hotelCheckedOut(m.getHotelCheckedOut())
                    .returnFlightBoarded(m.getReturnFlightBoarded())
                    .journeyEnded(m.getJourneyEnded())
                    .flightBoardedVerification(m.getFlightBoardedVerification())
                    .flightLandedVerification(m.getFlightLandedVerification())
                    .cabPickedUpVerification(m.getCabPickedUpVerification())
                    .hotelCheckedInVerification(m.getHotelCheckedInVerification())
                    .hotelCheckedOutVerification(m.getHotelCheckedOutVerification())
                    .returnFlightBoardedVerification(m.getReturnFlightBoardedVerification())
                    .journeyEndedVerification(m.getJourneyEndedVerification())
                    .flightBoardedAt(m.getFlightBoardedAt() != null ? m.getFlightBoardedAt().toString() : null)
                    .flightLandedAt(m.getFlightLandedAt() != null ? m.getFlightLandedAt().toString() : null)
                    .cabPickedUpAt(m.getCabPickedUpAt() != null ? m.getCabPickedUpAt().toString() : null)
                    .hotelCheckedInAt(m.getHotelCheckedInAt() != null ? m.getHotelCheckedInAt().toString() : null)
                    .hotelCheckedOutAt(m.getHotelCheckedOutAt() != null ? m.getHotelCheckedOutAt().toString() : null)
                    .returnFlightBoardedAt(m.getReturnFlightBoardedAt() != null ? m.getReturnFlightBoardedAt().toString() : null)
                    .journeyEndedAt(m.getJourneyEndedAt() != null ? m.getJourneyEndedAt().toString() : null)
                    .updatedAt(m.getUpdatedAt() != null ? m.getUpdatedAt().toString() : null)
                    .build();

            // Attach scheduled checklist timeline if available
            timelineRepository.findByTripRequestId(r.getId()).ifPresent(tl -> {
                milestoneDTO.setScheduledTimeline(ChecklistTimelineDTO.builder()
                        .tripId(r.getId())
                        .flightBoardingTime(tl.getFlightBoardingTime() != null ? tl.getFlightBoardingTime().toString() : null)
                        .flightLandingTime(tl.getFlightLandingTime() != null ? tl.getFlightLandingTime().toString() : null)
                        .cabPickupTime(tl.getCabPickupTime() != null ? tl.getCabPickupTime().toString() : null)
                        .hotelCheckinTime(tl.getHotelCheckinTime() != null ? tl.getHotelCheckinTime().toString() : null)
                        .hotelCheckoutTime(tl.getHotelCheckoutTime() != null ? tl.getHotelCheckoutTime().toString() : null)
                        .returnFlightTime(tl.getReturnFlightTime() != null ? tl.getReturnFlightTime().toString() : null)
                        .journeyEndTime(tl.getJourneyEndTime() != null ? tl.getJourneyEndTime().toString() : null)
                        .build());
            });

            dto.setMilestones(milestoneDTO);
        }

        return dto;
    }
}
