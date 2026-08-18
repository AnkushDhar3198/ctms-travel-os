package com.ctms.service;

import com.ctms.dto.UserProfileDTO;
import com.ctms.entity.User;
import com.ctms.entity.enums.TripStatus;
import com.ctms.exception.ResourceNotFoundException;
import com.ctms.repository.TripRequestRepository;
import com.ctms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TripRequestRepository tripRequestRepository;

    public UserProfileDTO getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        long activeTrips = tripRequestRepository.countByEmployeeIdAndStatus(userId, TripStatus.ACTIVE);
        long totalTrips = tripRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(userId).size();

        return UserProfileDTO.builder()
                .id(user.getId())
                .empId(user.getEmpId())
                .name(user.getName())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .profilePicUrl(user.getProfilePicUrl())
                .dateOfJoining(user.getDateOfJoining())
                .contact(user.getContact())
                .passportNumber(user.getPassportNumber())
                .govtId(user.getGovtId())
                .department(user.getDepartment())
                .designation(user.getDesignation())
                .activeTripsCount(activeTrips)
                .totalTrips(totalTrips)
                .build();
    }

    public UserProfileDTO getUserProfileByEmpId(String empId) {
        User user = userRepository.findByEmpId(empId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        return getUserProfile(user.getId());
    }

    public java.util.List<UserProfileDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> {
                    long activeTrips = tripRequestRepository.countByEmployeeIdAndStatus(user.getId(), TripStatus.ACTIVE);
                    long totalTrips = tripRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(user.getId()).size();
                    return UserProfileDTO.builder()
                            .id(user.getId())
                            .empId(user.getEmpId())
                            .name(user.getName())
                            .role(user.getRole().name())
                            .isActive(user.getIsActive())
                            .department(user.getDepartment())
                            .designation(user.getDesignation())
                            .dateOfJoining(user.getDateOfJoining())
                            .contact(user.getContact())
                            .activeTripsCount(activeTrips)
                            .totalTrips(totalTrips)
                            .build();
                })
                .toList();
    }
}
