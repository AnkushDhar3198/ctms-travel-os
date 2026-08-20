package com.ctms.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TripMilestoneDTO {

    private Long tripId;

    // Milestone completion status
    private Boolean flightBoarded;
    private Boolean flightLanded;
    private Boolean cabPickedUp;
    private Boolean hotelCheckedIn;
    private Boolean hotelCheckedOut;
    private Boolean returnFlightBoarded;
    private Boolean journeyEnded;

    // Verification texts
    private String flightBoardedVerification;
    private String flightLandedVerification;
    private String cabPickedUpVerification;
    private String hotelCheckedInVerification;
    private String hotelCheckedOutVerification;
    private String returnFlightBoardedVerification;
    private String journeyEndedVerification;

    // Actual completion timestamps
    private String flightBoardedAt;
    private String flightLandedAt;
    private String cabPickedUpAt;
    private String hotelCheckedInAt;
    private String hotelCheckedOutAt;
    private String returnFlightBoardedAt;
    private String journeyEndedAt;

    // Scheduled timeline (set by Travel Desk)
    private ChecklistTimelineDTO scheduledTimeline;

    private String updatedAt;
}
