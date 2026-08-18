package com.ctms.controller;

import com.ctms.dto.AuthResponse;
import com.ctms.dto.EmployeeLoginRequest;
import com.ctms.dto.PasscodeLoginRequest;
import com.ctms.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/employee-login")
    public ResponseEntity<AuthResponse> employeeLogin(
            @Valid @RequestBody EmployeeLoginRequest request
    ) {
        AuthResponse response = authService.employeeLogin(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/passcode-login")
    public ResponseEntity<AuthResponse> passcodeLogin(
            @Valid @RequestBody PasscodeLoginRequest request
    ) {
        AuthResponse response = authService.passcodeLogin(request);
        return ResponseEntity.ok(response);
    }
}
