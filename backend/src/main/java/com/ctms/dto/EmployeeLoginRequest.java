package com.ctms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class EmployeeLoginRequest {

    @NotBlank(message = "Employee ID is required")
    private String empId;

    @NotBlank(message = "Password is required")
    private String password;
}
