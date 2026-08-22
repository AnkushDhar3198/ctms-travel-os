package com.ctms.controller;

import com.ctms.dto.FlightSuggestionDTO;
import com.ctms.service.FlightSuggestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
@RequiredArgsConstructor
public class FlightController {

    private final FlightSuggestionService flightSuggestionService;

    @GetMapping("/suggestions")
    public ResponseEntity<List<FlightSuggestionDTO>> getFlightSuggestions(
            @RequestParam(required = false, defaultValue = "BLR") String destination,
            @RequestParam(required = false, defaultValue = "DEL") String origin,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String returnDate,
            @RequestParam(required = false, defaultValue = "0") Integer extraLuggage
    ) {
        return ResponseEntity.ok(flightSuggestionService.generateSuggestions(
                destination, origin, date, returnDate, extraLuggage
        ));
    }

    @GetMapping("/return-suggestions")
    public ResponseEntity<List<FlightSuggestionDTO>> getReturnFlightSuggestions(
            @RequestParam(required = false, defaultValue = "BLR") String from,
            @RequestParam(required = false, defaultValue = "DEL") String to,
            @RequestParam(required = false) String returnDate,
            @RequestParam(required = false, defaultValue = "0") Integer extraLuggage
    ) {
        return ResponseEntity.ok(flightSuggestionService.generateReturnSuggestions(
                from, to, returnDate, extraLuggage
        ));
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<FlightSuggestionDTO>> getTripFlightSuggestions(@PathVariable Long tripId) {
        return ResponseEntity.ok(flightSuggestionService.getSuggestionsForTrip(tripId));
    }

    @GetMapping("/trip/{tripId}/return")
    public ResponseEntity<List<FlightSuggestionDTO>> getTripReturnFlightSuggestions(@PathVariable Long tripId) {
        return ResponseEntity.ok(flightSuggestionService.getReturnSuggestionsForTrip(tripId));
    }
}
