package com.ctms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class PasscodeLoginRequest {

    @NotBlank(message = "Role is required")
    private String role;

    @NotBlank(message = "Passcode is required")
    @Pattern(regexp = "^\\d{6}$", message = "Passcode must be exactly 6 digits")
    private String passcode;
}
