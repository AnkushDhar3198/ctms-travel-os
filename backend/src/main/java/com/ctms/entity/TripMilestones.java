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

    @Column(name = "flight_boarded_verification")
    private String flightBoardedVerification;

    @Column(name = "flight_boarded_at")
    private LocalDateTime flightBoardedAt;

    @Column(name = "flight_landed")
    private Boolean flightLanded = false;

    @Column(name = "flight_landed_verification")
    private String flightLandedVerification;

    @Column(name = "flight_landed_at")
    private LocalDateTime flightLandedAt;

    @Column(name = "cab_picked_up")
    private Boolean cabPickedUp = false;

    @Column(name = "cab_picked_up_verification")
    private String cabPickedUpVerification;

    @Column(name = "cab_picked_up_at")
    private LocalDateTime cabPickedUpAt;

    @Column(name = "hotel_checked_in")
    private Boolean hotelCheckedIn = false;

    @Column(name = "hotel_checked_in_verification")
    private String hotelCheckedInVerification;

    @Column(name = "hotel_checked_in_at")
    private LocalDateTime hotelCheckedInAt;

    @Column(name = "hotel_checked_out")
    private Boolean hotelCheckedOut = false;

    @Column(name = "hotel_checked_out_verification")
    private String hotelCheckedOutVerification;

    @Column(name = "hotel_checked_out_at")
    private LocalDateTime hotelCheckedOutAt;

    @Column(name = "return_flight_boarded")
    private Boolean returnFlightBoarded = false;

    @Column(name = "return_flight_boarded_verification")
    private String returnFlightBoardedVerification;

    @Column(name = "return_flight_boarded_at")
    private LocalDateTime returnFlightBoardedAt;

    @Column(name = "journey_ended")
    private Boolean journeyEnded = false;

    @Column(name = "journey_ended_verification")
    private String journeyEndedVerification;

    @Column(name = "journey_ended_at")
    private LocalDateTime journeyEndedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
