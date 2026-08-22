package com.ctms.repository;

import com.ctms.entity.TripRequest;
import com.ctms.entity.enums.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripRequestRepository extends JpaRepository<TripRequest, Long> {

    List<TripRequest> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    List<TripRequest> findByEmployeeIdAndStatus(Long employeeId, TripStatus status);

    List<TripRequest> findByStatus(TripStatus status);

    List<TripRequest> findByStatusOrderByCreatedAtDesc(TripStatus status);

    List<TripRequest> findByStatusIn(List<TripStatus> statuses);

    List<TripRequest> findAllByOrderByCreatedAtDesc();

    long countByEmployeeIdAndStatus(Long employeeId, TripStatus status);
}
