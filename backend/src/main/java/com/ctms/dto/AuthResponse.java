package com.ctms.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private Long userId;
    private String empId;
    private String name;
    private String role;
}
