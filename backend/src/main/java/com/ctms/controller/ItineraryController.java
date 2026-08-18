package com.ctms.controller;

import com.ctms.dto.ItineraryDTO;
import com.ctms.service.ItineraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/itinerary")
@RequiredArgsConstructor
public class ItineraryController {

    private final ItineraryService itineraryService;

    @PostMapping("/{tripId}")
    @PreAuthorize("hasAnyRole('TRAVEL_DESK', 'ADMIN')")
    public ResponseEntity<ItineraryDTO> createItinerary(
            @PathVariable Long tripId,
            @RequestBody ItineraryDTO dto
    ) {
        return ResponseEntity.ok(itineraryService.createOrUpdateItinerary(tripId, dto));
    }

    @GetMapping("/{tripId}")
    public ResponseEntity<ItineraryDTO> getItinerary(@PathVariable Long tripId) {
        return ResponseEntity.ok(itineraryService.getItinerary(tripId));
    }

    @PutMapping("/{tripId}/activate")
    @PreAuthorize("hasAnyRole('TRAVEL_DESK', 'ADMIN')")
    public ResponseEntity<Map<String, String>> activateTrip(@PathVariable Long tripId) {
        itineraryService.activateTrip(tripId);
        return ResponseEntity.ok(Map.of("message", "Trip activated successfully."));
    }

    @PutMapping("/{tripId}/assets-returned")
    @PreAuthorize("hasAnyRole('TRAVEL_DESK', 'ADMIN')")
    public ResponseEntity<Map<String, String>> markAssetsReturned(@PathVariable Long tripId) {
        itineraryService.markAssetsReturned(tripId);
        return ResponseEntity.ok(Map.of("message", "Assets marked as returned."));
    }
}
