package com.ctms.repository;

import com.ctms.entity.TripRequest;
import com.ctms.entity.enums.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripRequestRepository extends JpaRepository<TripRequest, Long> {

    List<TripRequest> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    List<TripRequest> findByEmployeeIdAndStatus(Long employeeId, TripStatus status);

    List<TripRequest> findByStatus(TripStatus status);

    List<TripRequest> findByStatusOrderByCreatedAtDesc(TripStatus status);

    List<TripRequest> findByStatusIn(List<TripStatus> statuses);

    List<TripRequest> findAllByOrderByCreatedAtDesc();

    long countByEmployeeIdAndStatus(Long employeeId, TripStatus status);

    // ===== Optimized JOIN FETCH queries (eliminates N+1 problem) =====

    @Query("SELECT t FROM TripRequest t " +
           "LEFT JOIN FETCH t.employee " +
           "LEFT JOIN FETCH t.itinerary " +
           "LEFT JOIN FETCH t.milestones " +
           "LEFT JOIN FETCH t.checklistTimeline " +
           "WHERE t.employee.id = :employeeId " +
           "ORDER BY t.createdAt DESC")
    List<TripRequest> findByEmployeeIdWithDetails(@Param("employeeId") Long employeeId);

    @Query("SELECT t FROM TripRequest t " +
           "LEFT JOIN FETCH t.employee " +
           "LEFT JOIN FETCH t.itinerary " +
           "LEFT JOIN FETCH t.milestones " +
           "LEFT JOIN FETCH t.checklistTimeline " +
           "WHERE t.status = :status " +
           "ORDER BY t.createdAt DESC")
    List<TripRequest> findByStatusWithDetails(@Param("status") TripStatus status);

    @Query("SELECT t FROM TripRequest t " +
           "LEFT JOIN FETCH t.employee " +
           "LEFT JOIN FETCH t.itinerary " +
           "LEFT JOIN FETCH t.milestones " +
           "LEFT JOIN FETCH t.checklistTimeline " +
           "ORDER BY t.createdAt DESC")
    List<TripRequest> findAllWithDetails();

    @Query("SELECT t FROM TripRequest t " +
           "LEFT JOIN FETCH t.employee " +
           "LEFT JOIN FETCH t.itinerary " +
           "LEFT JOIN FETCH t.milestones " +
           "LEFT JOIN FETCH t.checklistTimeline " +
           "WHERE t.id = :id")
    Optional<TripRequest> findByIdWithDetails(@Param("id") Long id);
}
