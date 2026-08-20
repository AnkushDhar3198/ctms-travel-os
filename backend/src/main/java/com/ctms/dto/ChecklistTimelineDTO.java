package com.ctms.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChecklistTimelineDTO {

    private Long tripId;
    private String flightBoardingTime;
    private String flightLandingTime;
    private String cabPickupTime;
    private String hotelCheckinTime;
    private String hotelCheckoutTime;
    private String returnFlightTime;
    private String journeyEndTime;
}
