package com.ctms.controller;

import com.ctms.dto.*;
import com.ctms.service.LiveTrackingService;
import com.ctms.service.TripClosureService;
import com.ctms.service.TripRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripRequestService tripRequestService;
    private final LiveTrackingService liveTrackingService;
    private final TripClosureService tripClosureService;

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<TripRequestDTO> createTrip(
            @Valid @RequestBody TripRequestDTO dto,
            HttpServletRequest request
    ) {
        Long userId = (Long) request.getAttribute("userId");
        TripRequestDTO created = tripRequestService.createTripRequest(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripRequestDTO> getTripById(@PathVariable Long id) {
        return ResponseEntity.ok(tripRequestService.getTripById(id));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TripRequestDTO>> getEmployeeTrips(@PathVariable Long employeeId) {
        return ResponseEntity.ok(tripRequestService.getTripsForEmployee(employeeId));
    }

    @GetMapping("/my-trips")
    public ResponseEntity<List<TripRequestDTO>> getMyTrips(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        return ResponseEntity.ok(tripRequestService.getTripsForEmployee(userId));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TripRequestDTO>> getPendingRequests() {
        return ResponseEntity.ok(tripRequestService.getPendingManagerRequests());
    }

    @GetMapping("/approved")
    @PreAuthorize("hasAnyRole('TRAVEL_DESK', 'ADMIN')")
    public ResponseEntity<List<TripRequestDTO>> getApprovedRequests() {
        return ResponseEntity.ok(tripRequestService.getApprovedRequests());
    }

    @GetMapping("/active")
    public ResponseEntity<List<TripRequestDTO>> getActiveTrips() {
        return ResponseEntity.ok(tripRequestService.getActiveTrips());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TripRequestDTO>> getAllTrips() {
        return ResponseEntity.ok(tripRequestService.getAllTrips());
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TripRequestDTO> approveTrip(
            @PathVariable Long id,
            @RequestBody ApprovalRequest approval
    ) {
        return ResponseEntity.ok(tripRequestService.approveRequest(id, approval));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TripRequestDTO> rejectTrip(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String reason = body.getOrDefault("reason", "Request rejected by manager.");
        return ResponseEntity.ok(tripRequestService.rejectRequest(id, reason));
    }

    // ==================== Live Tracking ====================

    @PatchMapping("/{id}/milestone")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<TripMilestoneDTO> updateMilestone(
            @PathVariable Long id,
            @Valid @RequestBody MilestoneUpdateRequest request
    ) {
        return ResponseEntity.ok(liveTrackingService.updateMilestone(id, request));
    }

    @GetMapping("/{id}/milestones")
    public ResponseEntity<TripMilestoneDTO> getMilestones(@PathVariable Long id) {
        return ResponseEntity.ok(liveTrackingService.getMilestones(id));
    }

    // ==================== Trip Closure ====================

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Map<String, String>> closeTrip(@PathVariable Long id) {
        tripClosureService.closeActiveTrip(id);
        return ResponseEntity.ok(Map.of(
                "message", "Trip closed successfully.",
                "tripId", id.toString()
        ));
    }
}
