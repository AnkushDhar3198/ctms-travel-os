package com.ctms.entity;

import com.ctms.entity.enums.TripStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TripRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(name = "project_no", nullable = false)
    private String projectNo;

    @Column(name = "client_id", nullable = false)
    private String clientId;

    @Column(nullable = false)
    private String destination;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "estimated_cost", precision = 12, scale = 2)
    private BigDecimal estimatedCost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TripStatus status;

    @Column(name = "needs_flight")
    private Boolean needsFlight = false;

    @Column(name = "needs_hotel")
    private Boolean needsHotel = false;

    @Column(name = "needs_cab")
    private Boolean needsCab = false;

    @Column(name = "extra_luggage_kg")
    private Integer extraLuggageKg;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "tripRequest", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private TripItinerary itinerary;

    @OneToOne(mappedBy = "tripRequest", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private TripMilestones milestones;

    @OneToOne(mappedBy = "tripRequest", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private TripChecklistTimeline checklistTimeline;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = TripStatus.PENDING_AUTO_VAL;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
