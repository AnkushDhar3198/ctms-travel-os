package com.ctms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class MilestoneUpdateRequest {

    @NotBlank(message = "Milestone name is required")
    private String milestoneName;

    @NotNull(message = "Value is required")
    private Boolean value;
}
