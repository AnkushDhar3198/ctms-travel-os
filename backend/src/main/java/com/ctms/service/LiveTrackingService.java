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
     * Updates a specific milestone on an active trip.
     * Requires verification text — stores it alongside the completion.
     * Returns the full updated milestone state including scheduled timeline.
     */
    @Transactional
    public TripMilestoneDTO updateMilestone(Long tripId, MilestoneUpdateRequest request) {
        TripRequest tripRequest = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Trip not found. The requested trip ID does not exist."
                ));

        if (tripRequest.getStatus() != TripStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Milestones can only be updated for active trips. Current status: " +
                    tripRequest.getStatus().name()
            );
        }

        TripMilestones milestones = milestonesRepository.findByTripRequestId(tripId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Trip milestones not found. The itinerary may not have been set up yet."
                ));

        // Validate verification text
        String verification = request.getVerificationText();
        if (verification == null || verification.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Verification text is required to complete a milestone."
            );
        }

        LocalDateTime now = LocalDateTime.now();

        // Update the specific milestone field with verification and timestamp
        switch (request.getMilestoneName().toLowerCase()) {
            case "flight_boarded" -> {
                milestones.setFlightBoarded(request.getValue());
                milestones.setFlightBoardedVerification(verification.trim());
                milestones.setFlightBoardedAt(now);
            }
            case "flight_landed" -> {
                milestones.setFlightLanded(request.getValue());
                milestones.setFlightLandedVerification(verification.trim());
                milestones.setFlightLandedAt(now);
            }
            case "cab_picked_up" -> {
                milestones.setCabPickedUp(request.getValue());
                milestones.setCabPickedUpVerification(verification.trim());
                milestones.setCabPickedUpAt(now);
            }
            case "hotel_checked_in" -> {
                milestones.setHotelCheckedIn(request.getValue());
                milestones.setHotelCheckedInVerification(verification.trim());
                milestones.setHotelCheckedInAt(now);
            }
            case "hotel_checked_out" -> {
                milestones.setHotelCheckedOut(request.getValue());
                milestones.setHotelCheckedOutVerification(verification.trim());
                milestones.setHotelCheckedOutAt(now);
            }
            case "return_flight_boarded" -> {
                milestones.setReturnFlightBoarded(request.getValue());
                milestones.setReturnFlightBoardedVerification(verification.trim());
                milestones.setReturnFlightBoardedAt(now);
            }
            case "journey_ended" -> {
                milestones.setJourneyEnded(request.getValue());
                milestones.setJourneyEndedVerification(verification.trim());
                milestones.setJourneyEndedAt(now);
            }
            default -> throw new IllegalArgumentException(
                    "Unknown milestone: '" + request.getMilestoneName() +
                    "'. Valid milestones are: flight_boarded, flight_landed, cab_picked_up, " +
                    "hotel_checked_in, hotel_checked_out, return_flight_boarded, journey_ended."
            );
        }

        milestones.setUpdatedAt(now);
        milestonesRepository.save(milestones);

        log.info("Trip {} milestone '{}' updated to {} with verification '{}'", tripId,
                request.getMilestoneName(), request.getValue(), verification.trim());

        return toDTO(milestones, tripId);
    }

    /**
     * Get the current milestone state for a trip, including scheduled timeline.
     */
    public TripMilestoneDTO getMilestones(Long tripId) {
        TripMilestones milestones = milestonesRepository.findByTripRequestId(tripId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Milestones not found for trip ID " + tripId
                ));
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
