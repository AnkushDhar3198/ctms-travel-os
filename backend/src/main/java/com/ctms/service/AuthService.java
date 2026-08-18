package com.ctms.service;

import com.ctms.dto.AuthResponse;
import com.ctms.dto.EmployeeLoginRequest;
import com.ctms.dto.PasscodeLoginRequest;
import com.ctms.entity.User;
import com.ctms.entity.enums.UserRole;
import com.ctms.exception.UnauthorizedException;
import com.ctms.repository.UserRepository;
import com.ctms.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * Employee login: validates empId + password, returns JWT.
     */
    public AuthResponse employeeLogin(EmployeeLoginRequest request) {
        User user = userRepository.findByEmpId(request.getEmpId())
                .orElseThrow(() -> new UnauthorizedException(
                        "We couldn't find an account with that Employee ID. Please check and try again."
                ));

        if (!user.getRole().equals(UserRole.EMPLOYEE)) {
            throw new UnauthorizedException(
                    "This login is for employees only. Please use Elevated Access for your role."
            );
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException(
                    "The password you entered is incorrect. Please try again."
            );
        }

        if (!user.getIsActive()) {
            throw new UnauthorizedException(
                    "Your account has been deactivated. Please contact your administrator."
            );
        }

        String token = jwtUtil.generateToken(
                user.getId(), user.getEmpId(), user.getName(), user.getRole().name()
        );

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .empId(user.getEmpId())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }

    /**
     * Elevated login: validates role + 6-digit passcode, returns JWT.
     * No username/password required — the passcode is role-specific.
     */
    public AuthResponse passcodeLogin(PasscodeLoginRequest request) {
        UserRole role;
        try {
            role = UserRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new UnauthorizedException(
                    "Invalid role selection. Please choose a valid role."
            );
        }

        if (role == UserRole.EMPLOYEE) {
            throw new UnauthorizedException(
                    "Employees must use the standard login. This access is for elevated roles only."
            );
        }

        User user = userRepository.findByRoleAndPasscode(role, request.getPasscode())
                .orElseThrow(() -> new UnauthorizedException(
                        "Invalid passcode for the selected role. Please verify and try again."
                ));

        if (!user.getIsActive()) {
            throw new UnauthorizedException(
                    "This account has been deactivated. Please contact your administrator."
            );
        }

        String token = jwtUtil.generateToken(
                user.getId(), user.getEmpId(), user.getName(), user.getRole().name()
        );

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .empId(user.getEmpId())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }
}
