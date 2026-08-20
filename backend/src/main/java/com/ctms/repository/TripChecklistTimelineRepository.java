package com.ctms.repository;

import com.ctms.entity.TripChecklistTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TripChecklistTimelineRepository extends JpaRepository<TripChecklistTimeline, Long> {
    Optional<TripChecklistTimeline> findByTripRequestId(Long tripRequestId);
}
