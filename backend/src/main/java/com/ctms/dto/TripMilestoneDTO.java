package com.ctms.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TripMilestoneDTO {

    private Long tripId;
    private Boolean flightBoarded;
    private Boolean flightLanded;
    private Boolean cabPickedUp;
    private Boolean hotelCheckedIn;
    private Boolean hotelCheckedOut;
    private Boolean returnFlightBoarded;
    private Boolean journeyEnded;
    private String updatedAt;
}
