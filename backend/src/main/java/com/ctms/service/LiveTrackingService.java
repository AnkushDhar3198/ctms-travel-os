package com.ctms.service;

import com.ctms.dto.TripMilestoneDTO;
import com.ctms.dto.MilestoneUpdateRequest;
import com.ctms.entity.TripMilestones;
import com.ctms.entity.TripRequest;
import com.ctms.entity.enums.TripStatus;
import com.ctms.exception.ResourceNotFoundException;
import com.ctms.repository.TripMilestonesRepository;
import com.ctms.repository.TripRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Step 5 of Workflow: Live trip tracking.
 * Updates individual milestones and returns updated state for optimistic UI rendering.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LiveTrackingService {

    private final TripMilestonesRepository milestonesRepository;
    private final TripRequestRepository tripRequestRepository;

    /**
     * Updates a specific milestone on an active trip.
     * Returns the full updated milestone state for the frontend.
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

        // Update the specific milestone field
        switch (request.getMilestoneName().toLowerCase()) {
            case "flight_boarded" -> milestones.setFlightBoarded(request.getValue());
            case "flight_landed" -> milestones.setFlightLanded(request.getValue());
            case "cab_picked_up" -> milestones.setCabPickedUp(request.getValue());
            case "hotel_checked_in" -> milestones.setHotelCheckedIn(request.getValue());
            case "hotel_checked_out" -> milestones.setHotelCheckedOut(request.getValue());
            case "return_flight_boarded" -> milestones.setReturnFlightBoarded(request.getValue());
            case "journey_ended" -> milestones.setJourneyEnded(request.getValue());
            default -> throw new IllegalArgumentException(
                    "Unknown milestone: '" + request.getMilestoneName() +
                    "'. Valid milestones are: flight_boarded, flight_landed, cab_picked_up, " +
                    "hotel_checked_in, hotel_checked_out, return_flight_boarded, journey_ended."
            );
        }

        milestones.setUpdatedAt(LocalDateTime.now());
        milestonesRepository.save(milestones);

        log.info("Trip {} milestone '{}' updated to {}", tripId,
                request.getMilestoneName(), request.getValue());

        return toDTO(milestones, tripId);
    }

    /**
     * Get the current milestone state for a trip.
     */
    public TripMilestoneDTO getMilestones(Long tripId) {
        TripMilestones milestones = milestonesRepository.findByTripRequestId(tripId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Milestones not found for trip ID " + tripId
                ));
        return toDTO(milestones, tripId);
    }

    private TripMilestoneDTO toDTO(TripMilestones m, Long tripId) {
        return TripMilestoneDTO.builder()
                .tripId(tripId)
                .flightBoarded(m.getFlightBoarded())
                .flightLanded(m.getFlightLanded())
                .cabPickedUp(m.getCabPickedUp())
                .hotelCheckedIn(m.getHotelCheckedIn())
                .hotelCheckedOut(m.getHotelCheckedOut())
                .returnFlightBoarded(m.getReturnFlightBoarded())
                .journeyEnded(m.getJourneyEnded())
                .updatedAt(m.getUpdatedAt() != null ? m.getUpdatedAt().toString() : null)
                .build();
    }
}
