package com.ctms.service;

import com.ctms.dto.ChecklistTimelineDTO;
import com.ctms.dto.TripMilestoneDTO;
import com.ctms.dto.MilestoneUpdateRequest;
import com.ctms.entity.TripChecklistTimeline;
import com.ctms.entity.TripMilestones;
import com.ctms.entity.TripRequest;
import com.ctms.entity.enums.TripStatus;
import com.ctms.exception.ResourceNotFoundException;
import com.ctms.repository.TripChecklistTimelineRepository;
import com.ctms.repository.TripMilestonesRepository;
import com.ctms.repository.TripRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Step 5 of Workflow: Live trip tracking.
 * Updates individual milestones with mandatory verification and returns
 * updated state including scheduled timeline for optimistic UI rendering.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LiveTrackingService {

    private final TripMilestonesRepository milestonesRepository;
    private final TripRequestRepository tripRequestRepository;
    private final TripChecklistTimelineRepository timelineRepository;

    /**
     * Updates a specific milestone on an active (or approved) trip.
     * Requires verification text — stores it alongside the completion.
     * Returns the full updated milestone state including scheduled timeline.
     */
    @Transactional
    public TripMilestoneDTO updateMilestone(Long tripId, MilestoneUpdateRequest request) {
        TripRequest tripRequest = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Trip not found. The requested trip ID does not exist."
                ));

        // Allow both ACTIVE and APPROVED trips (auto-promote APPROVED to ACTIVE)
        if (tripRequest.getStatus() != TripStatus.ACTIVE && tripRequest.getStatus() != TripStatus.APPROVED) {
            throw new IllegalStateException(
                    "Milestones can only be updated for active or approved trips. Current status: " +
                    tripRequest.getStatus().name()
            );
        }

        // Auto-promote APPROVED trip to ACTIVE if employee starts checking in
        if (tripRequest.getStatus() == TripStatus.APPROVED) {
            tripRequest.setStatus(TripStatus.ACTIVE);
            log.info("Trip {} automatically promoted from APPROVED to ACTIVE on milestone verification", tripId);
        }

        // Auto-initialize milestones if not already present
        TripMilestones milestones = milestonesRepository.findByTripRequestId(tripId)
                .orElseGet(() -> {
                    TripMilestones m = TripMilestones.builder()
                            .tripRequest(tripRequest)
                            .flightBoarded(false)
                            .flightLanded(false)
                            .cabPickedUp(false)
                            .hotelCheckedIn(false)
                            .hotelCheckedOut(false)
                            .returnFlightBoarded(false)
                            .journeyEnded(false)
                            .build();
                    return milestonesRepository.save(m);
                });

        // Validate verification text
        String verification = request.getVerificationText();
        if (verification == null || verification.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Verification text is required to complete a milestone."
            );
        }

        LocalDateTime now = LocalDateTime.now();
        boolean val = request.getValue() != null ? request.getValue() : true;
        String vText = verification.trim();

        // Update the specific milestone field with verification and timestamp
        String key = request.getMilestoneName() != null ? request.getMilestoneName().toLowerCase().replace("-", "_").trim() : "";
        switch (key) {
            case "flight_boarded" -> {
                milestones.setFlightBoarded(val);
                milestones.setFlightBoardedVerification(vText);
                milestones.setFlightBoardedAt(now);
            }
            case "flight_landed" -> {
                milestones.setFlightLanded(val);
                milestones.setFlightLandedVerification(vText);
                milestones.setFlightLandedAt(now);
            }
            case "cab_picked_up" -> {
                milestones.setCabPickedUp(val);
                milestones.setCabPickedUpVerification(vText);
                milestones.setCabPickedUpAt(now);
            }
            case "hotel_checked_in" -> {
                milestones.setHotelCheckedIn(val);
                milestones.setHotelCheckedInVerification(vText);
                milestones.setHotelCheckedInAt(now);
            }
            case "hotel_checked_out" -> {
                milestones.setHotelCheckedOut(val);
                milestones.setHotelCheckedOutVerification(vText);
                milestones.setHotelCheckedOutAt(now);
            }
            case "return_flight_boarded" -> {
                milestones.setReturnFlightBoarded(val);
                milestones.setReturnFlightBoardedVerification(vText);
                milestones.setReturnFlightBoardedAt(now);
            }
            case "journey_ended" -> {
                milestones.setJourneyEnded(val);
                milestones.setJourneyEndedVerification(vText);
                milestones.setJourneyEndedAt(now);
            }
            default -> throw new IllegalArgumentException(
                    "Unknown milestone: '" + request.getMilestoneName() +
                    "'. Valid milestones are: flight_boarded, flight_landed, cab_picked_up, " +
                    "hotel_checked_in, hotel_checked_out, return_flight_boarded, journey_ended."
            );
        }

        milestones.setUpdatedAt(now);
        milestones = milestonesRepository.save(milestones);

        tripRequest.setMilestones(milestones);
        tripRequestRepository.save(tripRequest);

        log.info("Trip {} milestone '{}' updated to {} with verification '{}'", tripId,
                request.getMilestoneName(), val, vText);

        return toDTO(milestones, tripId);
    }

    /**
     * Get the current milestone state for a trip, including scheduled timeline.
     * Auto-initializes default empty milestones if they haven't been created yet.
     */
    @Transactional
    public TripMilestoneDTO getMilestones(Long tripId) {
        TripRequest tripRequest = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Trip not found with ID " + tripId
                ));

        TripMilestones milestones = milestonesRepository.findByTripRequestId(tripId)
                .orElseGet(() -> {
                    TripMilestones m = TripMilestones.builder()
                            .tripRequest(tripRequest)
                            .flightBoarded(false)
                            .flightLanded(false)
                            .cabPickedUp(false)
                            .hotelCheckedIn(false)
                            .hotelCheckedOut(false)
                            .returnFlightBoarded(false)
                            .journeyEnded(false)
                            .build();
                    TripMilestones saved = milestonesRepository.save(m);
                    tripRequest.setMilestones(saved);
                    tripRequestRepository.save(tripRequest);
                    return saved;
                });
        return toDTO(milestones, tripId);
    }

    private TripMilestoneDTO toDTO(TripMilestones m, Long tripId) {
        TripMilestoneDTO dto = TripMilestoneDTO.builder()
                .tripId(tripId)
                // Completion status
                .flightBoarded(m.getFlightBoarded())
                .flightLanded(m.getFlightLanded())
                .cabPickedUp(m.getCabPickedUp())
                .hotelCheckedIn(m.getHotelCheckedIn())
                .hotelCheckedOut(m.getHotelCheckedOut())
                .returnFlightBoarded(m.getReturnFlightBoarded())
                .journeyEnded(m.getJourneyEnded())
                // Verification texts
                .flightBoardedVerification(m.getFlightBoardedVerification())
                .flightLandedVerification(m.getFlightLandedVerification())
                .cabPickedUpVerification(m.getCabPickedUpVerification())
                .hotelCheckedInVerification(m.getHotelCheckedInVerification())
                .hotelCheckedOutVerification(m.getHotelCheckedOutVerification())
                .returnFlightBoardedVerification(m.getReturnFlightBoardedVerification())
                .journeyEndedVerification(m.getJourneyEndedVerification())
                // Actual completion timestamps
                .flightBoardedAt(toStr(m.getFlightBoardedAt()))
                .flightLandedAt(toStr(m.getFlightLandedAt()))
                .cabPickedUpAt(toStr(m.getCabPickedUpAt()))
                .hotelCheckedInAt(toStr(m.getHotelCheckedInAt()))
                .hotelCheckedOutAt(toStr(m.getHotelCheckedOutAt()))
                .returnFlightBoardedAt(toStr(m.getReturnFlightBoardedAt()))
                .journeyEndedAt(toStr(m.getJourneyEndedAt()))
                // Updated at
                .updatedAt(toStr(m.getUpdatedAt()))
                .build();

        // Attach scheduled timeline if available
        timelineRepository.findByTripRequestId(tripId).ifPresent(timeline -> {
            dto.setScheduledTimeline(ChecklistTimelineDTO.builder()
                    .tripId(tripId)
                    .flightBoardingTime(toStr(timeline.getFlightBoardingTime()))
                    .flightLandingTime(toStr(timeline.getFlightLandingTime()))
                    .cabPickupTime(toStr(timeline.getCabPickupTime()))
                    .hotelCheckinTime(toStr(timeline.getHotelCheckinTime()))
                    .hotelCheckoutTime(toStr(timeline.getHotelCheckoutTime()))
                    .returnFlightTime(toStr(timeline.getReturnFlightTime()))
                    .journeyEndTime(toStr(timeline.getJourneyEndTime()))
                    .build());
        });

        return dto;
    }

    private String toStr(LocalDateTime dt) {
        return dt != null ? dt.toString() : null;
    }
}
