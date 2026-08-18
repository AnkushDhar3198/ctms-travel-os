package com.ctms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trip_itinerary")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TripItinerary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_request_id", unique = true, nullable = false)
    private TripRequest tripRequest;

    @Column(length = 50)
    private String pnr;

    @Column(name = "flight_details", columnDefinition = "TEXT")
    private String flightDetails;

    @Column(name = "cab_driver_name")
    private String cabDriverName;

    @Column(name = "cab_number")
    private String cabNumber;

    @Column(name = "cab_details", columnDefinition = "TEXT")
    private String cabDetails;

    @Column(name = "hotel_name")
    private String hotelName;

    @Column(name = "hotel_address", columnDefinition = "TEXT")
    private String hotelAddress;

    @Column(name = "hotel_details", columnDefinition = "TEXT")
    private String hotelDetails;

    @Column(name = "allocated_assets", columnDefinition = "TEXT")
    private String allocatedAssets;

    @Column(name = "assets_returned")
    private Boolean assetsReturned = false;
}
