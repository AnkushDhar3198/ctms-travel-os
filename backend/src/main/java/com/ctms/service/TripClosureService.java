package com.ctms.service;

import com.ctms.entity.TripItinerary;
import com.ctms.entity.TripMilestones;
import com.ctms.entity.TripRequest;
import com.ctms.entity.enums.ExpenseStatus;
import com.ctms.entity.enums.TripStatus;
import com.ctms.exception.PendingExpensesException;
import com.ctms.exception.ResourceNotFoundException;
import com.ctms.exception.TripClosureException;
import com.ctms.repository.ExpenseRepository;
import com.ctms.repository.TripItineraryRepository;
import com.ctms.repository.TripMilestonesRepository;
import com.ctms.repository.TripRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Step 7 of Workflow: Trip closure with strict 4-rule enforcement.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TripClosureService {

    private final TripRequestRepository tripRequestRepository;
    private final TripMilestonesRepository milestonesRepository;
    private final TripItineraryRepository itineraryRepository;
    private final ExpenseRepository expenseRepository;

    public com.ctms.dto.TripClosureCheckDTO checkClosureEligibility(Long tripId) {
        TripRequest trip = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found."));

        boolean datePassed = LocalDate.now().isAfter(trip.getEndDate()) || LocalDate.now().isEqual(trip.getEndDate());
        
        long pendingExpensesCount = expenseRepository.countByTripRequestIdAndStatusNot(tripId, ExpenseStatus.CREDITED);
        boolean expensesCredited = pendingExpensesCount == 0;

        TripItinerary itinerary = itineraryRepository.findByTripRequestId(tripId).orElse(null);
        boolean assetsReturned = true;
        String allocatedAssets = "None";
        if (itinerary != null && itinerary.getAllocatedAssets() != null && !itinerary.getAllocatedAssets().isBlank()) {
            allocatedAssets = itinerary.getAllocatedAssets();
            assetsReturned = Boolean.TRUE.equals(itinerary.getAssetsReturned());
        }

        TripMilestones milestones = milestonesRepository.findByTripRequestId(tripId).orElse(null);
        boolean journeyEnded = milestones != null && Boolean.TRUE.equals(milestones.getJourneyEnded());

        boolean canClose = expensesCredited && assetsReturned && (journeyEnded || datePassed);

        StringBuilder blockReason = new StringBuilder();
        if (!expensesCredited) blockReason.append("Pending ").append(pendingExpensesCount).append(" expense(s). ");
        if (!assetsReturned) blockReason.append("Allocated assets (").append(allocatedAssets).append(") not marked returned. ");
        if (!journeyEnded && !datePassed) blockReason.append("Journey has not ended and end date (").append(trip.getEndDate()).append(") is in future.");

        return com.ctms.dto.TripClosureCheckDTO.builder()
                .tripId(tripId)
                .datePassed(datePassed)
                .endDate(trip.getEndDate().toString())
                .expensesCredited(expensesCredited)
                .pendingExpensesCount(pendingExpensesCount)
                .assetsReturned(assetsReturned)
                .allocatedAssets(allocatedAssets)
                .journeyEnded(journeyEnded)
                .canClose(canClose)
                .closureBlockReason(blockReason.length() > 0 ? blockReason.toString() : "Eligible for closure.")
                .build();
    }

    /**
     * Closes an active trip when 4 conditions pass (or when force = true).
     */
    @Transactional
    public void closeActiveTrip(Long tripId, boolean force) {
        TripRequest trip = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Trip not found. The requested trip does not exist."
                ));

        if (trip.getStatus() != TripStatus.ACTIVE) {
            throw new TripClosureException(
                    "Only active trips can be closed. This trip's current status is: " +
                    trip.getStatus().name()
            );
        }

        if (!force) {
            var check = checkClosureEligibility(tripId);
            if (!check.isCanClose()) {
                throw new TripClosureException(check.getClosureBlockReason());
            }
        }

        // All rules passed — close the trip
        trip.setStatus(TripStatus.CLOSED);
        tripRequestRepository.save(trip);

        log.info("Trip {} successfully closed (force={})", tripId, force);
    }

    @Transactional
    public void closeActiveTrip(Long tripId) {
        closeActiveTrip(tripId, false);
    }
}
