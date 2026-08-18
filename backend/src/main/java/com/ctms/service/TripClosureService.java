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

    /**
     * Closes an active trip only when ALL 4 conditions are met:
     *  1. Current date is strictly after trip end date
     *  2. ALL linked expenses have status CREDITED
     *  3. Allocated assets are marked as RETURNED
     *  4. Journey ended milestone is TRUE
     */
    @Transactional
    public void closeActiveTrip(Long tripId) {
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

        // Rule 1: Verify current date is strictly after end_date
        if (!LocalDate.now().isAfter(trip.getEndDate())) {
            throw new TripClosureException(
                    "This trip cannot be closed yet. The scheduled end date (" +
                    trip.getEndDate() + ") has not passed. Please wait until the trip period is complete."
            );
        }

        // Rule 2: ALL linked expenses must have status CREDITED
        boolean hasPendingExpenses = expenseRepository
                .existsByTripRequestIdAndStatusNot(tripId, ExpenseStatus.CREDITED);
        if (hasPendingExpenses) {
            long pendingCount = expenseRepository
                    .countByTripRequestIdAndStatusNot(tripId, ExpenseStatus.CREDITED);
            throw new PendingExpensesException(
                    "There are " + pendingCount + " expense(s) still pending settlement. " +
                    "All expenses must be credited before the trip can be closed. " +
                    "Please check with the finance team."
            );
        }

        // Rule 3: Allocated assets must be marked as RETURNED
        TripItinerary itinerary = itineraryRepository.findByTripRequestId(tripId)
                .orElse(null);
        if (itinerary != null
                && itinerary.getAllocatedAssets() != null
                && !itinerary.getAllocatedAssets().isBlank()
                && !Boolean.TRUE.equals(itinerary.getAssetsReturned())) {
            throw new TripClosureException(
                    "Assets allocated for this trip have not been returned yet. " +
                    "Please coordinate with the Travel Desk to return all assets before closing."
            );
        }

        // Rule 4: journey_ended milestone must be TRUE
        TripMilestones milestones = milestonesRepository.findByTripRequestId(tripId)
                .orElseThrow(() -> new TripClosureException(
                        "Trip milestones not found. The tracking record is incomplete."
                ));
        if (!Boolean.TRUE.equals(milestones.getJourneyEnded())) {
            throw new TripClosureException(
                    "The journey has not been marked as ended yet. " +
                    "Please update the 'Journey Ended' milestone in your trip timeline before closing."
            );
        }

        // All 4 rules passed — close the trip
        trip.setStatus(TripStatus.CLOSED);
        tripRequestRepository.save(trip);

        log.info("Trip {} successfully closed", tripId);
    }
}
