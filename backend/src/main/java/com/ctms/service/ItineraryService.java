package com.ctms.service;

import com.ctms.dto.ItineraryDTO;
import com.ctms.entity.TripItinerary;
import com.ctms.entity.TripMilestones;
import com.ctms.entity.TripRequest;
import com.ctms.entity.enums.TripStatus;
import com.ctms.exception.ResourceNotFoundException;
import com.ctms.repository.TripItineraryRepository;
import com.ctms.repository.TripMilestonesRepository;
import com.ctms.repository.TripRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ItineraryService {

    private final TripItineraryRepository itineraryRepository;
    private final TripRequestRepository tripRequestRepository;
    private final TripMilestonesRepository milestonesRepository;

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
        itineraryRepository.findByTripRequestId(tripId)
                .orElseThrow(() -> new IllegalStateException(
                        "An itinerary must be created before activating the trip."
                ));

        // Initialize milestones
        if (milestonesRepository.findByTripRequestId(tripId).isEmpty()) {
            TripMilestones milestones = TripMilestones.builder()
                    .tripRequest(trip)
                    .flightBoarded(false)
                    .flightLanded(false)
                    .cabPickedUp(false)
                    .hotelCheckedIn(false)
                    .hotelCheckedOut(false)
                    .returnFlightBoarded(false)
                    .journeyEnded(false)
                    .build();
            milestonesRepository.save(milestones);
        }

        trip.setStatus(TripStatus.ACTIVE);
        tripRequestRepository.save(trip);

        log.info("Trip {} activated with itinerary", tripId);
    }

    /**
     * Mark assets as returned (Travel Desk action).
     */
    @Transactional
    public void markAssetsReturned(Long tripId) {
        TripItinerary itinerary = itineraryRepository.findByTripRequestId(tripId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No itinerary found for trip ID " + tripId
                ));

        itinerary.setAssetsReturned(true);
        itineraryRepository.save(itinerary);
        log.info("Assets marked as returned for trip {}", tripId);
    }

    private ItineraryDTO toDTO(TripItinerary it, Long tripId) {
        return ItineraryDTO.builder()
                .tripId(tripId)
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
                .build();
    }
}
