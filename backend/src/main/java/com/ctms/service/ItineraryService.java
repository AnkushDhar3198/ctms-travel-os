package com.ctms.service;

import com.ctms.dto.ChecklistTimelineDTO;
import com.ctms.dto.ItineraryDTO;
import com.ctms.entity.TripChecklistTimeline;
import com.ctms.entity.TripItinerary;
import com.ctms.entity.TripMilestones;
import com.ctms.entity.TripRequest;
import com.ctms.entity.enums.TripStatus;
import com.ctms.exception.ResourceNotFoundException;
import com.ctms.repository.TripChecklistTimelineRepository;
import com.ctms.repository.TripItineraryRepository;
import com.ctms.repository.TripMilestonesRepository;
import com.ctms.repository.TripRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ItineraryService {

    private final TripItineraryRepository itineraryRepository;
    private final TripRequestRepository tripRequestRepository;
    private final TripMilestonesRepository milestonesRepository;
    private final TripChecklistTimelineRepository timelineRepository;

    /**
     * Create or update itinerary for an approved trip (Travel Desk action).
     */
    @Transactional
    public ItineraryDTO createOrUpdateItinerary(Long tripId, ItineraryDTO dto) {
        TripRequest trip = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip request not found."));

        if (trip.getStatus() != TripStatus.APPROVED && trip.getStatus() != TripStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Itinerary can only be created for approved or active trips. Current status: " +
                    trip.getStatus().name()
            );
        }

        TripItinerary itinerary = itineraryRepository.findByTripRequestId(tripId)
                .orElse(TripItinerary.builder().tripRequest(trip).build());

        itinerary.setPnr(dto.getPnr());
        itinerary.setFlightDetails(dto.getFlightDetails());
        itinerary.setReturnPnr(dto.getReturnPnr());
        itinerary.setReturnFlightDetails(dto.getReturnFlightDetails());
        itinerary.setCabDriverName(dto.getCabDriverName());
        itinerary.setCabNumber(dto.getCabNumber());
        itinerary.setCabDetails(dto.getCabDetails());
        itinerary.setHotelName(dto.getHotelName());
        itinerary.setHotelAddress(dto.getHotelAddress());
        itinerary.setHotelDetails(dto.getHotelDetails());
        itinerary.setAllocatedAssets(dto.getAllocatedAssets());

        if (dto.getAssetsReturned() != null) {
            itinerary.setAssetsReturned(dto.getAssetsReturned());
        }

        itineraryRepository.save(itinerary);
        trip.setItinerary(itinerary);
        tripRequestRepository.save(trip);
        log.info("Itinerary created/updated for trip {}", tripId);

        return toDTO(itinerary, tripId);
    }

    /**
     * Get itinerary for a trip.
     */
    public ItineraryDTO getItinerary(Long tripId) {
        TripItinerary itinerary = itineraryRepository.findByTripRequestId(tripId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No itinerary found for trip ID " + tripId
                ));
        return toDTO(itinerary, tripId);
    }

    /**
     * Activate a trip after itinerary is complete (Travel Desk action).
     * Also initializes the milestones tracker.
     */
    @Transactional
    public void activateTrip(Long tripId) {
        TripRequest trip = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip request not found."));

        if (trip.getStatus() != TripStatus.APPROVED) {
            throw new IllegalStateException(
                    "Only approved trips can be activated. Current status: " + trip.getStatus().name()
            );
        }

        // Ensure itinerary exists
        TripItinerary itinerary = itineraryRepository.findByTripRequestId(tripId)
                .orElseThrow(() -> new IllegalStateException(
                        "An itinerary must be created before activating the trip."
                ));

        // Initialize milestones
        TripMilestones milestones = milestonesRepository.findByTripRequestId(tripId)
                .orElseGet(() -> {
                    TripMilestones m = TripMilestones.builder()
                            .tripRequest(trip)
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

        trip.setItinerary(itinerary);
        trip.setMilestones(milestones);
        trip.setStatus(TripStatus.ACTIVE);
        tripRequestRepository.save(trip);

        log.info("Trip {} activated with itinerary", tripId);
    }

    /**
     * Save or update the checklist timeline for a trip (Travel Desk action).
     * The timeline contains scheduled date/times for each milestone.
     */
    @Transactional
    public ChecklistTimelineDTO saveChecklistTimeline(Long tripId, ChecklistTimelineDTO dto) {
        TripRequest trip = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip request not found."));

        if (trip.getStatus() != TripStatus.APPROVED && trip.getStatus() != TripStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Checklist timeline can only be set for approved or active trips. Current status: " +
                    trip.getStatus().name()
            );
        }

        TripChecklistTimeline timeline = timelineRepository.findByTripRequestId(tripId)
                .orElse(TripChecklistTimeline.builder().tripRequest(trip).build());

        if (dto.getFlightBoardingTime() != null) {
            timeline.setFlightBoardingTime(LocalDateTime.parse(dto.getFlightBoardingTime()));
        }
        if (dto.getFlightLandingTime() != null) {
            timeline.setFlightLandingTime(LocalDateTime.parse(dto.getFlightLandingTime()));
        }
        if (dto.getCabPickupTime() != null) {
            timeline.setCabPickupTime(LocalDateTime.parse(dto.getCabPickupTime()));
        }
        if (dto.getHotelCheckinTime() != null) {
            timeline.setHotelCheckinTime(LocalDateTime.parse(dto.getHotelCheckinTime()));
        }
        if (dto.getHotelCheckoutTime() != null) {
            timeline.setHotelCheckoutTime(LocalDateTime.parse(dto.getHotelCheckoutTime()));
        }
        if (dto.getReturnFlightTime() != null) {
            timeline.setReturnFlightTime(LocalDateTime.parse(dto.getReturnFlightTime()));
        }
        if (dto.getJourneyEndTime() != null) {
            timeline.setJourneyEndTime(LocalDateTime.parse(dto.getJourneyEndTime()));
        }

        timelineRepository.save(timeline);
        trip.setChecklistTimeline(timeline);
        tripRequestRepository.save(trip);
        log.info("Checklist timeline saved for trip {}", tripId);

        return toTimelineDTO(timeline, tripId);
    }

    /**
     * Get checklist timeline for a trip.
     */
    public ChecklistTimelineDTO getChecklistTimeline(Long tripId) {
        TripChecklistTimeline timeline = timelineRepository.findByTripRequestId(tripId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No checklist timeline found for trip ID " + tripId
                ));
        return toTimelineDTO(timeline, tripId);
    }

    /**
     * Mark assets as returned (Travel Desk action).
     */
    @Transactional
    public void markAssetsReturned(Long tripId) {
        TripRequest trip = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip request not found."));

        TripItinerary itinerary = itineraryRepository.findByTripRequestId(tripId)
                .orElseGet(() -> {
                    TripItinerary newIt = TripItinerary.builder()
                            .tripRequest(trip)
                            .allocatedAssets("Standard Travel Assets")
                            .assetsReturned(true)
                            .build();
                    return itineraryRepository.save(newIt);
                });

        itinerary.setAssetsReturned(true);
        itineraryRepository.save(itinerary);
        log.info("Assets marked as returned for trip {}", tripId);
    }

    private ItineraryDTO toDTO(TripItinerary it, Long tripId) {
        return ItineraryDTO.builder()
                .tripId(tripId)
                .pnr(it.getPnr())
                .flightDetails(it.getFlightDetails())
                .returnPnr(it.getReturnPnr())
                .returnFlightDetails(it.getReturnFlightDetails())
                .cabDriverName(it.getCabDriverName())
                .cabNumber(it.getCabNumber())
                .cabDetails(it.getCabDetails())
                .hotelName(it.getHotelName())
                .hotelAddress(it.getHotelAddress())
                .hotelDetails(it.getHotelDetails())
                .allocatedAssets(it.getAllocatedAssets())
                .assetsReturned(it.getAssetsReturned())
                .build();
    }

    private ChecklistTimelineDTO toTimelineDTO(TripChecklistTimeline t, Long tripId) {
        return ChecklistTimelineDTO.builder()
                .tripId(tripId)
                .flightBoardingTime(t.getFlightBoardingTime() != null ? t.getFlightBoardingTime().toString() : null)
                .flightLandingTime(t.getFlightLandingTime() != null ? t.getFlightLandingTime().toString() : null)
                .cabPickupTime(t.getCabPickupTime() != null ? t.getCabPickupTime().toString() : null)
                .hotelCheckinTime(t.getHotelCheckinTime() != null ? t.getHotelCheckinTime().toString() : null)
                .hotelCheckoutTime(t.getHotelCheckoutTime() != null ? t.getHotelCheckoutTime().toString() : null)
                .returnFlightTime(t.getReturnFlightTime() != null ? t.getReturnFlightTime().toString() : null)
                .journeyEndTime(t.getJourneyEndTime() != null ? t.getJourneyEndTime().toString() : null)
                .build();
    }
}
