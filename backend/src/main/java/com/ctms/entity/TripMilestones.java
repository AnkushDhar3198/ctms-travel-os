package com.ctms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "trip_milestones")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TripMilestones {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_request_id", unique = true, nullable = false)
    private TripRequest tripRequest;

    @Column(name = "flight_boarded")
    private Boolean flightBoarded = false;

    @Column(name = "flight_landed")
    private Boolean flightLanded = false;

    @Column(name = "cab_picked_up")
    private Boolean cabPickedUp = false;

    @Column(name = "hotel_checked_in")
    private Boolean hotelCheckedIn = false;

    @Column(name = "hotel_checked_out")
    private Boolean hotelCheckedOut = false;

    @Column(name = "return_flight_boarded")
    private Boolean returnFlightBoarded = false;

    @Column(name = "journey_ended")
    private Boolean journeyEnded = false;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
