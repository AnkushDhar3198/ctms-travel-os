package com.ctms.service;

import com.ctms.dto.FlightSuggestionDTO;
import com.ctms.entity.TripRequest;
import com.ctms.exception.ResourceNotFoundException;
import com.ctms.repository.TripRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightSuggestionService {

    private final TripRequestRepository tripRequestRepository;

    // Mapping of popular city names / keywords to airport codes and names
    private static final Map<String, AirportInfo> AIRPORT_MAP = new HashMap<>();

    static {
        AIRPORT_MAP.put("DELHI", new AirportInfo("DEL", "Indira Gandhi Intl", "Delhi, India"));
        AIRPORT_MAP.put("NEW DELHI", new AirportInfo("DEL", "Indira Gandhi Intl", "Delhi, India"));
        AIRPORT_MAP.put("MUMBAI", new AirportInfo("BOM", "Chhatrapati Shivaji Maharaj Intl", "Mumbai, India"));
        AIRPORT_MAP.put("BOMBAY", new AirportInfo("BOM", "Chhatrapati Shivaji Maharaj Intl", "Mumbai, India"));
        AIRPORT_MAP.put("BENGALURU", new AirportInfo("BLR", "Kempegowda Intl", "Bengaluru, India"));
        AIRPORT_MAP.put("BANGALORE", new AirportInfo("BLR", "Kempegowda Intl", "Bengaluru, India"));
        AIRPORT_MAP.put("HYDERABAD", new AirportInfo("HYD", "Rajiv Gandhi Intl", "Hyderabad, India"));
        AIRPORT_MAP.put("CHENNAI", new AirportInfo("MAA", "Chennai Intl", "Chennai, India"));
        AIRPORT_MAP.put("MADRAS", new AirportInfo("MAA", "Chennai Intl", "Chennai, India"));
        AIRPORT_MAP.put("KOLKATA", new AirportInfo("CCU", "Netaji Subhash Chandra Bose Intl", "Kolkata, India"));
        AIRPORT_MAP.put("CALCUTTA", new AirportInfo("CCU", "Netaji Subhash Chandra Bose Intl", "Kolkata, India"));
        AIRPORT_MAP.put("PUNE", new AirportInfo("PNQ", "Pune Intl", "Pune, India"));
        AIRPORT_MAP.put("GOA", new AirportInfo("GOI", "Manohar Intl (MOPA)", "Goa, India"));
        AIRPORT_MAP.put("AHMEDABAD", new AirportInfo("AMD", "Sardar Vallabhbhai Patel Intl", "Ahmedabad, India"));
        AIRPORT_MAP.put("JAIPUR", new AirportInfo("JAI", "Jaipur Intl", "Jaipur, India"));
        AIRPORT_MAP.put("KOCHI", new AirportInfo("COK", "Cochin Intl", "Kochi, India"));
        AIRPORT_MAP.put("COCHIN", new AirportInfo("COK", "Cochin Intl", "Kochi, India"));
        AIRPORT_MAP.put("DUBAI", new AirportInfo("DXB", "Dubai Intl", "Dubai, UAE"));
        AIRPORT_MAP.put("LONDON", new AirportInfo("LHR", "Heathrow Airport", "London, UK"));
        AIRPORT_MAP.put("SINGAPORE", new AirportInfo("SIN", "Changi Airport", "Singapore"));
        AIRPORT_MAP.put("SAN FRANCISCO", new AirportInfo("SFO", "San Francisco Intl", "San Francisco, USA"));
        AIRPORT_MAP.put("NEW YORK", new AirportInfo("JFK", "John F. Kennedy Intl", "New York, USA"));
        AIRPORT_MAP.put("FRANKFURT", new AirportInfo("FRA", "Frankfurt Airport", "Frankfurt, Germany"));
        AIRPORT_MAP.put("TOKYO", new AirportInfo("HND", "Haneda Airport", "Tokyo, Japan"));
    }

    private static class AirportInfo {
        String code;
        String name;
        String city;

        AirportInfo(String code, String name, String city) {
            this.code = code;
            this.name = name;
            this.city = city;
        }
    }

    /**
     * Get outbound suggestions based on a Trip Request ID
     */
    public List<FlightSuggestionDTO> getSuggestionsForTrip(Long tripId) {
        TripRequest trip = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip request #" + tripId + " not found."));

        String destination = trip.getDestination();
        String startDate = trip.getStartDate() != null ? trip.getStartDate().toString() : null;
        String endDate = trip.getEndDate() != null ? trip.getEndDate().toString() : null;
        Integer extraLuggage = trip.getExtraLuggageKg() != null ? trip.getExtraLuggageKg() : 0;

        return generateSuggestions(destination, "DEL", startDate, endDate, extraLuggage);
    }

    /**
     * Get return flight suggestions based on a Trip Request ID.
     * Returns flights from destination → origin (home city), using endDate as the flight date.
     */
    public List<FlightSuggestionDTO> getReturnSuggestionsForTrip(Long tripId) {
        TripRequest trip = tripRequestRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip request #" + tripId + " not found."));

        String destination = trip.getDestination();
        String endDate = trip.getEndDate() != null ? trip.getEndDate().toString() : null;
        Integer extraLuggage = trip.getExtraLuggageKg() != null ? trip.getExtraLuggageKg() : 0;

        // For return: origin is the trip destination, destination is home (DEL)
        return generateReturnSuggestions(destination, "DEL", endDate, extraLuggage);
    }

    /**
     * Generate return flight suggestions (destination → origin/home)
     */
    public List<FlightSuggestionDTO> generateReturnSuggestions(
            String fromCityStr,
            String toCityStr,
            String returnDate,
            Integer extraLuggageKg
    ) {
        AirportInfo fromAirport = resolveAirport(fromCityStr, "BLR", "Kempegowda Intl", fromCityStr);
        AirportInfo toAirport = resolveAirport(toCityStr, "DEL", "Indira Gandhi Intl", "Delhi, India");

        if (fromAirport.code.equalsIgnoreCase(toAirport.code)) {
            toAirport = fromAirport.code.equals("DEL")
                ? new AirportInfo("BOM", "Chhatrapati Shivaji Maharaj Intl", "Mumbai, India")
                : new AirportInfo("DEL", "Indira Gandhi Intl", "Delhi, India");
        }

        String validReturnDate = (returnDate != null && !returnDate.isBlank()) ? returnDate : "2026-09-05";
        int extraLuggage = (extraLuggageKg != null) ? extraLuggageKg : 0;

        List<FlightSuggestionDTO> suggestions = new ArrayList<>();
        boolean isInternational = isInternationalRoute(fromAirport.code);

        if (!isInternational) {
            suggestions.add(createReturnFlight(
                    "RF-201", "IndiGo", "6E", "✈️", "6E-6119", "Airbus A320neo",
                    fromAirport, toAirport, "07:00", "09:35", "2h 35m", "Non-stop",
                    5450.0, "₹", "Economy (Corporate Flex)",
                    (15 + extraLuggage) + "kg Check-in + 7kg Cabin", "Early Return",
                    validReturnDate, "05:00", "09:35"
            ));
            suggestions.add(createReturnFlight(
                    "RF-202", "Air India", "AI", "🛩️", "AI-805", "Boeing 787-8",
                    fromAirport, toAirport, "10:30", "13:15", "2h 45m", "Non-stop",
                    5100.0, "₹", "Economy (Complimentary Meal)",
                    (25 + extraLuggage) + "kg Check-in + 7kg Cabin", "Best Value Return",
                    validReturnDate, "08:30", "13:15"
            ));
            suggestions.add(createReturnFlight(
                    "RF-203", "Vistara", "UK", "🛫", "UK-853", "Airbus A321neo",
                    fromAirport, toAirport, "14:00", "16:35", "2h 35m", "Non-stop",
                    6700.0, "₹", "Premium Economy (Meal + Priority)",
                    (20 + extraLuggage) + "kg Check-in + 10kg Cabin", "Premium Return",
                    validReturnDate, "12:00", "16:35"
            ));
            suggestions.add(createReturnFlight(
                    "RF-204", "Akasa Air", "QP", "✈️", "QP-1305", "Boeing 737 MAX 8",
                    fromAirport, toAirport, "17:15", "19:55", "2h 40m", "Non-stop",
                    4750.0, "₹", "Economy Saver",
                    (15 + extraLuggage) + "kg Check-in + 7kg Cabin", "Budget Return",
                    validReturnDate, "15:15", "19:55"
            ));
            suggestions.add(createReturnFlight(
                    "RF-205", "IndiGo", "6E", "✈️", "6E-6220", "Airbus A320neo",
                    fromAirport, toAirport, "20:30", "23:10", "2h 40m", "Non-stop",
                    5850.0, "₹", "Economy (Corporate Flex)",
                    (15 + extraLuggage) + "kg Check-in + 7kg Cabin", "Late Night Return",
                    validReturnDate, "18:30", "23:10"
            ));
        } else {
            suggestions.add(createReturnFlight(
                    "RF-301", "Emirates", "EK", "✈️", "EK-513", "Boeing 777-300ER",
                    fromAirport, toAirport, "10:00", "16:30", "4h 30m", "Non-stop",
                    29200.0, "₹", "Economy Flex Plus",
                    (30 + extraLuggage) + "kg Check-in + 7kg Cabin", "Corporate Return",
                    validReturnDate, "07:00", "16:30"
            ));
            suggestions.add(createReturnFlight(
                    "RF-302", "Singapore Airlines", "SQ", "🛫", "SQ-404", "Airbus A350-900",
                    fromAirport, toAirport, "14:30", "22:45", "5h 45m", "Non-stop",
                    31800.0, "₹", "Economy Standard",
                    (30 + extraLuggage) + "kg Check-in + 7kg Cabin", "Best Value Return",
                    validReturnDate, "11:30", "22:45"
            ));
            suggestions.add(createReturnFlight(
                    "RF-303", "British Airways", "BA", "🛩️", "BA-143", "Boeing 787-9",
                    fromAirport, toAirport, "20:00", "08:45+1", "9h 45m", "Non-stop",
                    53800.0, "₹", "World Traveller (Economy)",
                    (23 + extraLuggage) + "kg Check-in + 10kg Cabin", "Overnight Return",
                    validReturnDate, "17:00", "08:45"
            ));
        }

        return suggestions;
    }

    /**
     * Generate suggestions for any given destination, origin, and dates
     */
    public List<FlightSuggestionDTO> generateSuggestions(
            String destinationStr,
            String originStr,
            String startDate,
            String endDate,
            Integer extraLuggageKg
    ) {
        AirportInfo destAirport = resolveAirport(destinationStr, "BLR", "Kempegowda Intl", destinationStr);
        AirportInfo originAirport = resolveAirport(originStr, "DEL", "Indira Gandhi Intl", "Delhi, India");

        // Prevent same origin & destination
        if (originAirport.code.equalsIgnoreCase(destAirport.code)) {
            originAirport = destAirport.code.equals("DEL") 
                ? new AirportInfo("BOM", "Chhatrapati Shivaji Maharaj Intl", "Mumbai, India")
                : new AirportInfo("DEL", "Indira Gandhi Intl", "Delhi, India");
        }

        String validStartDate = (startDate != null && !startDate.isBlank()) ? startDate : "2026-09-01";
        String validEndDate = (endDate != null && !endDate.isBlank()) ? endDate : "2026-09-05";
        int extraLuggage = (extraLuggageKg != null) ? extraLuggageKg : 0;

        List<FlightSuggestionDTO> suggestions = new ArrayList<>();

        boolean isInternational = isInternationalRoute(destAirport.code);

        if (!isInternational) {
            // Domestic options
            // Option 1: IndiGo Early Morning - Corporate Preferred
            suggestions.add(createFlight(
                    "FL-101", "IndiGo", "6E", "✈️", "6E-2041", "Airbus A320neo",
                    originAirport, destAirport, "06:15", "08:50", "2h 35m", "Non-stop",
                    5650.0, "₹", "Economy (Corporate Flex)",
                    (15 + extraLuggage) + "kg Check-in + 7kg Cabin", "Corporate Preferred",
                    validStartDate, validEndDate, "04:15", "08:50", "18:45"
            ));

            // Option 2: Air India Morning - Best Value
            suggestions.add(createFlight(
                    "FL-102", "Air India", "AI", "🛩️", "AI-804", "Boeing 787-8",
                    originAirport, destAirport, "08:30", "11:15", "2h 45m", "Non-stop",
                    5200.0, "₹", "Economy (Complimentary Meal)",
                    (25 + extraLuggage) + "kg Check-in + 7kg Cabin", "Best Value",
                    validStartDate, validEndDate, "06:30", "11:15", "19:30"
            ));

            // Option 3: Vistara Mid-Day - Premium Comfort
            suggestions.add(createFlight(
                    "FL-103", "Vistara", "UK", "🛫", "UK-852", "Airbus A321neo",
                    originAirport, destAirport, "11:45", "14:20", "2h 35m", "Non-stop",
                    6850.0, "₹", "Premium Economy (Complimentary Meal + Priority)",
                    (20 + extraLuggage) + "kg Check-in + 10kg Cabin", "Fastest",
                    validStartDate, validEndDate, "09:45", "14:20", "20:15"
            ));

            // Option 4: Akasa Air Afternoon - Budget Saver
            suggestions.add(createFlight(
                    "FL-104", "Akasa Air", "QP", "✈️", "QP-1304", "Boeing 737 MAX 8",
                    originAirport, destAirport, "14:30", "17:10", "2h 40m", "Non-stop",
                    4890.0, "₹", "Economy Saver",
                    (15 + extraLuggage) + "kg Check-in + 7kg Cabin", "Lowest Fare",
                    validStartDate, validEndDate, "12:30", "17:10", "21:00"
            ));

            // Option 5: IndiGo Evening Return-Ready
            suggestions.add(createFlight(
                    "FL-105", "IndiGo", "6E", "✈️", "6E-6118", "Airbus A320neo",
                    originAirport, destAirport, "18:20", "21:00", "2h 40m", "Non-stop",
                    5980.0, "₹", "Economy (Corporate Flex)",
                    (15 + extraLuggage) + "kg Check-in + 7kg Cabin", "Evening Direct",
                    validStartDate, validEndDate, "16:20", "21:00", "22:30"
            ));
        } else {
            // International options
            suggestions.add(createFlight(
                    "FL-201", "Emirates", "EK", "✈️", "EK-512", "Boeing 777-300ER",
                    originAirport, destAirport, "04:10", "08:35", "4h 25m", "Non-stop",
                    28500.0, "₹", "Economy Flex Plus",
                    (30 + extraLuggage) + "kg Check-in + 7kg Cabin", "Corporate Preferred",
                    validStartDate, validEndDate, "01:10", "08:35", "16:00"
            ));

            suggestions.add(createFlight(
                    "FL-202", "Singapore Airlines", "SQ", "🛫", "SQ-403", "Airbus A350-900",
                    originAirport, destAirport, "09:50", "18:05", "5h 45m", "Non-stop",
                    32400.0, "₹", "Economy Standard",
                    (30 + extraLuggage) + "kg Check-in + 7kg Cabin", "Best Value",
                    validStartDate, validEndDate, "06:50", "18:05", "21:30"
            ));

            suggestions.add(createFlight(
                    "FL-203", "British Airways", "BA", "🛩️", "BA-142", "Boeing 787-9",
                    originAirport, destAirport, "02:15", "07:30", "9h 45m", "Non-stop",
                    54200.0, "₹", "World Traveller (Economy)",
                    (23 + extraLuggage) + "kg Check-in + 10kg Cabin", "Fastest",
                    validStartDate, validEndDate, "23:15", "07:30", "14:15"
            ));
        }

        return suggestions;
    }

    private AirportInfo resolveAirport(String input, String defaultCode, String defaultName, String defaultCity) {
        if (input == null || input.isBlank()) {
            return new AirportInfo(defaultCode, defaultName, defaultCity);
        }

        String normalized = input.trim().toUpperCase();

        for (Map.Entry<String, AirportInfo> entry : AIRPORT_MAP.entrySet()) {
            if (normalized.contains(entry.getKey()) || entry.getKey().contains(normalized)) {
                return entry.getValue();
            }
        }

        // Check if user passed 3-letter IATA code directly
        if (normalized.length() == 3) {
            for (AirportInfo ai : AIRPORT_MAP.values()) {
                if (ai.code.equalsIgnoreCase(normalized)) {
                    return ai;
                }
            }
            return new AirportInfo(normalized, normalized + " International Airport", input);
        }

        // Extract first word / clean name
        String cleanName = input.split(",")[0].trim();
        String synthesizedCode = (cleanName.length() >= 3) ? cleanName.substring(0, 3).toUpperCase() : defaultCode;
        return new AirportInfo(synthesizedCode, cleanName + " Airport", input);
    }

    private boolean isInternationalRoute(String destCode) {
        return Set.of("DXB", "LHR", "SIN", "SFO", "JFK", "FRA", "HND", "NRT", "CDG").contains(destCode);
    }

    private FlightSuggestionDTO createFlight(
            String id, String airline, String code, String logo, String flightNo, String aircraft,
            AirportInfo origin, AirportInfo dest, String depTime, String arrTime, String duration, String stops,
            double price, String currency, String cabinClass, String baggage, String tag,
            String startDate, String endDate, String boardingTimeHHmm, String landingTimeHHmm, String returnTimeHHmm
    ) {
        String formattedSummary = String.format("%s %s (%s %s → %s %s) %s | %s%,.0f | %s",
                airline, flightNo, origin.code, depTime, dest.code, arrTime, stops, currency, price, cabinClass);

        return FlightSuggestionDTO.builder()
                .id(id)
                .airline(airline)
                .airlineCode(code)
                .airlineLogo(logo)
                .flightNumber(flightNo)
                .aircraft(aircraft)
                .origin(origin.city + " (" + origin.code + ")")
                .originCode(origin.code)
                .destination(dest.city + " (" + dest.code + ")")
                .destinationCode(dest.code)
                .departureTime(depTime)
                .arrivalTime(arrTime)
                .duration(duration)
                .stops(stops)
                .price(price)
                .currency(currency)
                .cabinClass(cabinClass)
                .baggageAllowance(baggage)
                .tag(tag)
                .formattedSummary(formattedSummary)
                .boardingTime(startDate + "T" + boardingTimeHHmm)
                .landingTime(startDate + "T" + landingTimeHHmm)
                .returnFlightTime(endDate + "T" + returnTimeHHmm)
                .build();
    }

    private FlightSuggestionDTO createReturnFlight(
            String id, String airline, String code, String logo, String flightNo, String aircraft,
            AirportInfo origin, AirportInfo dest, String depTime, String arrTime, String duration, String stops,
            double price, String currency, String cabinClass, String baggage, String tag,
            String returnDate, String boardingTimeHHmm, String landingTimeHHmm
    ) {
        String formattedSummary = String.format("%s %s (%s %s → %s %s) %s | %s%,.0f | %s",
                airline, flightNo, origin.code, depTime, dest.code, arrTime, stops, currency, price, cabinClass);

        return FlightSuggestionDTO.builder()
                .id(id)
                .airline(airline)
                .airlineCode(code)
                .airlineLogo(logo)
                .flightNumber(flightNo)
                .aircraft(aircraft)
                .origin(origin.city + " (" + origin.code + ")")
                .originCode(origin.code)
                .destination(dest.city + " (" + dest.code + ")")
                .destinationCode(dest.code)
                .departureTime(depTime)
                .arrivalTime(arrTime)
                .duration(duration)
                .stops(stops)
                .price(price)
                .currency(currency)
                .cabinClass(cabinClass)
                .baggageAllowance(baggage)
                .tag(tag)
                .formattedSummary(formattedSummary)
                .boardingTime(returnDate + "T" + boardingTimeHHmm)
                .landingTime(returnDate + "T" + landingTimeHHmm)
                .returnFlightTime(returnDate + "T" + landingTimeHHmm)
                .build();
    }
}
