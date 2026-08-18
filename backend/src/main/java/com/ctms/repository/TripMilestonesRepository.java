package com.ctms.repository;

import com.ctms.entity.TripMilestones;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TripMilestonesRepository extends JpaRepository<TripMilestones, Long> {

    Optional<TripMilestones> findByTripRequestId(Long tripRequestId);
}
