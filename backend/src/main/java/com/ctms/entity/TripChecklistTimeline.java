package com.ctms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "trip_checklist_timeline")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TripChecklistTimeline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_request_id", unique = true, nullable = false)
    private TripRequest tripRequest;

    @Column(name = "flight_boarding_time")
    private LocalDateTime flightBoardingTime;

    @Column(name = "flight_landing_time")
    private LocalDateTime flightLandingTime;

    @Column(name = "cab_pickup_time")
    private LocalDateTime cabPickupTime;

    @Column(name = "hotel_checkin_time")
    private LocalDateTime hotelCheckinTime;

    @Column(name = "hotel_checkout_time")
    private LocalDateTime hotelCheckoutTime;

    @Column(name = "return_flight_time")
    private LocalDateTime returnFlightTime;

    @Column(name = "journey_end_time")
    private LocalDateTime journeyEndTime;
}
