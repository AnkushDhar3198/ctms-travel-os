package com.ctms.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ItineraryDTO {

    private Long tripId;
    private String pnr;
    private String flightDetails;
    private String returnPnr;
    private String returnFlightDetails;
    private String cabDriverName;
    private String cabNumber;
    private String cabDetails;
    private String hotelName;
    private String hotelAddress;
    private String hotelDetails;
    private String allocatedAssets;
    private Boolean assetsReturned;
}
