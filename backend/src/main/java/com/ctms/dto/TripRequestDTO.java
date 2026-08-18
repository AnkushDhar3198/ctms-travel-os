package com.ctms.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TripRequestDTO {

    private Long id;

    @NotBlank(message = "Project number is required")
    private String projectNo;

    @NotBlank(message = "Client ID is required")
    private String clientId;

    @NotBlank(message = "Destination is required")
    private String destination;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @DecimalMin(value = "0.0", message = "Estimated cost must be positive")
    private BigDecimal estimatedCost;

    private Boolean needsFlight;
    private Boolean needsHotel;
    private Boolean needsCab;
    private Integer extraLuggageKg;

    // Read-only fields returned in responses
    private String status;
    private String employeeName;
    private String employeeEmpId;
    private String remarks;
    private String rejectionReason;
    private String createdAt;
    private String updatedAt;

    // Itinerary summary (when available)
    private ItineraryDTO itinerary;

    // Milestone summary (when available)
    private TripMilestoneDTO milestones;
}
