package com.ctms.repository;

import com.ctms.entity.TripItinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TripItineraryRepository extends JpaRepository<TripItinerary, Long> {

    Optional<TripItinerary> findByTripRequestId(Long tripRequestId);
}
