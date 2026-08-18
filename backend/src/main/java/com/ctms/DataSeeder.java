package com.ctms;

import com.ctms.entity.User;
import com.ctms.entity.enums.UserRole;
import com.ctms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping.");
            return;
        }

        String encodedPassword = passwordEncoder.encode("password123");

        // Employees
        userRepository.save(User.builder()
                .empId("EMP001").name("Arjun Sharma").password(encodedPassword)
                .role(UserRole.EMPLOYEE).isActive(true)
                .dateOfJoining("2022-03-15").contact("+91-9876543210")
                .passportNumber("P1234567").govtId("AADHAR-1234-5678-9012")
                .department("Engineering").designation("Software Engineer")
                .build());

        userRepository.save(User.builder()
                .empId("EMP002").name("Priya Patel").password(encodedPassword)
                .role(UserRole.EMPLOYEE).isActive(true)
                .dateOfJoining("2021-07-01").contact("+91-9876543211")
                .passportNumber("P2345678").govtId("AADHAR-2345-6789-0123")
                .department("Design").designation("UI/UX Designer")
                .build());

        userRepository.save(User.builder()
                .empId("EMP003").name("Rahul Verma").password(encodedPassword)
                .role(UserRole.EMPLOYEE).isActive(true)
                .dateOfJoining("2023-01-10").contact("+91-9876543212")
                .passportNumber("P3456789").govtId("AADHAR-3456-7890-1234")
                .department("Marketing").designation("Marketing Lead")
                .build());

        // Manager (passcode: 111111)
        userRepository.save(User.builder()
                .empId("MGR001").name("Vikram Singh").password(encodedPassword)
                .role(UserRole.MANAGER).isActive(true).passcode("111111")
                .dateOfJoining("2019-05-20").department("Engineering").designation("Engineering Manager")
                .build());

        // Travel Desk (passcode: 222222)
        userRepository.save(User.builder()
                .empId("TRV001").name("Sneha Reddy").password(encodedPassword)
                .role(UserRole.TRAVEL_DESK).isActive(true).passcode("222222")
                .dateOfJoining("2020-08-15").department("Operations").designation("Travel Coordinator")
                .build());

        // Finance (passcode: 333333)
        userRepository.save(User.builder()
                .empId("FIN001").name("Amit Kumar").password(encodedPassword)
                .role(UserRole.FINANCE).isActive(true).passcode("333333")
                .dateOfJoining("2020-02-10").department("Finance").designation("Finance Analyst")
                .build());

        // Admin (passcode: 444444)
        userRepository.save(User.builder()
                .empId("ADM001").name("Neha Gupta").password(encodedPassword)
                .role(UserRole.ADMIN).isActive(true).passcode("444444")
                .dateOfJoining("2018-11-01").department("IT").designation("System Administrator")
                .build());

        log.info("✅ Database seeded with 7 users (password: password123)");
    }
}
