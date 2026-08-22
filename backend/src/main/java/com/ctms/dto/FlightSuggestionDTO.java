package com.ctms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightSuggestionDTO {
    private String id;
    private String airline;
    private String airlineCode;
    private String airlineLogo;
    private String flightNumber;
    private String aircraft;
    private String origin;
    private String originCode;
    private String destination;
    private String destinationCode;
    private String departureTime;
    private String arrivalTime;
    private String duration;
    private String stops;
    private double price;
    private String currency;
    private String cabinClass;
    private String baggageAllowance;
    private String tag; // e.g. "Corporate Preferred", "Best Value", "Fastest", "Non-stop"
    private String formattedSummary;
    
    // ISO Date-Time suggestions matching trip dates for automatic timeline filling
    private String boardingTime;
    private String landingTime;
    private String returnFlightTime;
}
