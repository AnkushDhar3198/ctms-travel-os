package com.ctms.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserProfileDTO {

    private Long id;
    private String empId;
    private String name;
    private String role;
    private Boolean isActive;
    private String profilePicUrl;
    private String dateOfJoining;
    private String contact;
    private String passportNumber;
    private String govtId;
    private String department;
    private String designation;
    private long activeTripsCount;
    private long totalTrips;
}
