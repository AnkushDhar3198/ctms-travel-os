import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FlightSuggestion, HotelSuggestion, CabSuggestion, CitySuggestion } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private apiUrl = environment.apiUrl;

  private popularCities: CitySuggestion[] = [
    { name: 'Bengaluru', country: 'India', airportCode: 'BLR', popular: true },
    { name: 'Mumbai', country: 'India', airportCode: 'BOM', popular: true },
    { name: 'Delhi NCR', country: 'India', airportCode: 'DEL', popular: true },
    { name: 'Hyderabad', country: 'India', airportCode: 'HYD', popular: true },
    { name: 'Chennai', country: 'India', airportCode: 'MAA', popular: true },
    { name: 'Pune', country: 'India', airportCode: 'PNQ', popular: true },
    { name: 'Kolkata', country: 'India', airportCode: 'CCU', popular: true },
    { name: 'Goa', country: 'India', airportCode: 'GOI', popular: true },
    { name: 'Dubai', country: 'UAE', airportCode: 'DXB', popular: true },
    { name: 'London', country: 'UK', airportCode: 'LHR', popular: true },
    { name: 'Singapore', country: 'Singapore', airportCode: 'SIN', popular: true },
    { name: 'San Francisco', country: 'USA', airportCode: 'SFO', popular: true },
    { name: 'New York', country: 'USA', airportCode: 'JFK', popular: true },
    { name: 'Frankfurt', country: 'Germany', airportCode: 'FRA', popular: false },
    { name: 'Tokyo', country: 'Japan', airportCode: 'HND', popular: false }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Fetch flight suggestions for a specific trip ID
   */
  getSuggestionsForTrip(tripId: number): Observable<FlightSuggestion[]> {
    return this.http.get<FlightSuggestion[]>(`${this.apiUrl}/flights/trip/${tripId}`).pipe(
      catchError(() => of(this.getFallbackFlightSuggestions('Bengaluru', 'DEL', '2026-09-01', '2026-09-05', 0)))
    );
  }

  /**
   * Fetch flight suggestions with customizable search criteria
   */
  getFlightSuggestions(
    destination?: string,
    origin: string = 'DEL',
    startDate?: string,
    endDate?: string,
    extraLuggage: number = 0
  ): Observable<FlightSuggestion[]> {
    let params = new HttpParams()
      .set('destination', destination || 'BLR')
      .set('origin', origin || 'DEL')
      .set('extraLuggage', extraLuggage.toString());

    if (startDate) params = params.set('date', startDate);
    if (endDate) params = params.set('returnDate', endDate);

    return this.http.get<FlightSuggestion[]>(`${this.apiUrl}/flights/suggestions`, { params }).pipe(
      catchError(() => of(this.getFallbackFlightSuggestions(destination || 'BLR', origin, startDate, endDate, extraLuggage)))
    );
  }

  /**
   * Fetch RETURN flight suggestions (destination → home)
   */
  getReturnFlightSuggestions(
    from?: string,
    to: string = 'DEL',
    returnDate?: string,
    extraLuggage: number = 0
  ): Observable<FlightSuggestion[]> {
    let params = new HttpParams()
      .set('from', from || 'BLR')
      .set('to', to || 'DEL')
      .set('extraLuggage', extraLuggage.toString());

    if (returnDate) params = params.set('returnDate', returnDate);

    return this.http.get<FlightSuggestion[]>(`${this.apiUrl}/flights/return-suggestions`, { params }).pipe(
      catchError(() => of(this.getFallbackReturnFlightSuggestions(from || 'BLR', to, returnDate, extraLuggage)))
    );
  }

  /**
   * Filter cities for autocomplete
   */
  searchCities(query: string): CitySuggestion[] {
    if (!query || query.trim() === '') {
      return this.popularCities.filter(c => c.popular);
    }
    const q = query.toLowerCase().trim();
    return this.popularCities.filter(
      c => c.name.toLowerCase().includes(q) ||
           c.country.toLowerCase().includes(q) ||
           c.airportCode.toLowerCase().includes(q)
    );
  }

  /**
   * Suggest luxury / corporate-partner hotels matching destination
   */
  getHotelSuggestions(destination: string): HotelSuggestion[] {
    const dest = (destination || '').toLowerCase();
    const city = dest.split(',')[0].trim() || 'Bengaluru';
    const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1);

    return [
      {
        name: `The Oberoi, ${capitalizedCity}`,
        rating: '5.0 ★ Corporate Tier-1',
        address: `37-39 MG Road, Central District, ${capitalizedCity}`,
        category: 'Luxury Business',
        pricePerNight: '₹8,500/night',
        amenities: 'Executive Lounge, High-Speed WiFi, Airport Shuttle'
      },
      {
        name: `Taj West End & Towers, ${capitalizedCity}`,
        rating: '4.9 ★ Corporate Preferred',
        address: `Race Course Road, ${capitalizedCity}`,
        category: 'Heritage Luxury',
        pricePerNight: '₹7,800/night',
        amenities: 'Meeting Rooms, 24/7 Butler, Wellness Spa'
      },
      {
        name: `JW Marriott Hotel, ${capitalizedCity}`,
        rating: '4.8 ★ Business Partner',
        address: `Vittal Mallya Road, Tech Hub, ${capitalizedCity}`,
        category: 'Modern Business',
        pricePerNight: '₹6,900/night',
        amenities: 'Business Center, Poolside Dining, Gym'
      },
      {
        name: `Radisson Blu Plaza, ${capitalizedCity}`,
        rating: '4.7 ★ Value Corporate',
        address: `Outer Ring Road, Silicon Park, ${capitalizedCity}`,
        category: 'Corporate Standard',
        pricePerNight: '₹4,800/night',
        amenities: 'Complimentary Breakfast, Shuttle, Boardroom'
      }
    ];
  }

  /**
   * Suggest corporate cab fleet options
   */
  getCabSuggestions(destination: string): CabSuggestion[] {
    const city = (destination || 'Bengaluru').split(',')[0].trim();
    return [
      {
        provider: 'Uber for Business Black',
        driverName: 'Rameshwar Kumar',
        driverPhone: '+91-98765-43210',
        vehicleNumber: 'KA-01-MJ-4521',
        vehicleModel: 'Toyota Camry Hybrid (Sedan)',
        rating: '4.98 ★ Elite Driver'
      },
      {
        provider: 'Corporate Fleet VIP',
        driverName: 'Suresh Patil',
        driverPhone: '+91-98123-45678',
        vehicleNumber: 'KA-04-AB-9876',
        vehicleModel: 'Toyota Innova Crysta (SUV)',
        rating: '4.95 ★ Executive Fleet'
      },
      {
        provider: 'Ola Corporate Prime',
        driverName: 'Anil Deshmukh',
        driverPhone: '+91-97234-89012',
        vehicleNumber: 'DL-03-CC-3412',
        vehicleModel: 'Honda City ZX',
        rating: '4.91 ★ Corporate Star'
      }
    ];
  }

  /**
   * Client-side fallback generator
   */
  private getFallbackFlightSuggestions(
    destination: string,
    origin: string = 'DEL',
    startDate: string = '2026-09-01',
    endDate: string = '2026-09-05',
    extraLuggage: number = 0
  ): FlightSuggestion[] {
    const destCode = this.resolveAirportCode(destination);
    const originCode = origin.toUpperCase() || 'DEL';

    return [
      {
        id: 'FL-101',
        airline: 'IndiGo',
        airlineCode: '6E',
        airlineLogo: '✈️',
        flightNumber: '6E-2041',
        aircraft: 'Airbus A320neo',
        origin: `${originCode} - Terminal 3`,
        originCode: originCode,
        destination: `${destCode} - Terminal 2`,
        destinationCode: destCode,
        departureTime: '06:15',
        arrivalTime: '08:50',
        duration: '2h 35m',
        stops: 'Non-stop',
        price: 5650,
        currency: '₹',
        cabinClass: 'Economy (Corporate Flex)',
        baggageAllowance: `${15 + extraLuggage}kg Check-in + 7kg Cabin`,
        tag: 'Corporate Preferred',
        formattedSummary: `IndiGo 6E-2041 (${originCode} 06:15 → ${destCode} 08:50) Non-stop | ₹5,650 | Economy Flex`,
        boardingTime: `${startDate}T04:15`,
        landingTime: `${startDate}T08:50`,
        returnFlightTime: `${endDate}T18:45`
      },
      {
        id: 'FL-102',
        airline: 'Air India',
        airlineCode: 'AI',
        airlineLogo: '🛩️',
        flightNumber: 'AI-804',
        aircraft: 'Boeing 787-8 Dreamliner',
        origin: `${originCode} - Terminal 3`,
        originCode: originCode,
        destination: `${destCode} - Terminal 2`,
        destinationCode: destCode,
        departureTime: '08:30',
        arrivalTime: '11:15',
        duration: '2h 45m',
        stops: 'Non-stop',
        price: 5200,
        currency: '₹',
        cabinClass: 'Economy (Complimentary Meal)',
        baggageAllowance: `${25 + extraLuggage}kg Check-in + 7kg Cabin`,
        tag: 'Best Value',
        formattedSummary: `Air India AI-804 (${originCode} 08:30 → ${destCode} 11:15) Non-stop | ₹5,200 | Meal Included`,
        boardingTime: `${startDate}T06:30`,
        landingTime: `${startDate}T11:15`,
        returnFlightTime: `${endDate}T19:30`
      },
      {
        id: 'FL-103',
        airline: 'Vistara',
        airlineCode: 'UK',
        airlineLogo: '🛫',
        flightNumber: 'UK-852',
        aircraft: 'Airbus A321neo',
        origin: `${originCode} - Terminal 3`,
        originCode: originCode,
        destination: `${destCode} - Terminal 2`,
        destinationCode: destCode,
        departureTime: '11:45',
        arrivalTime: '14:20',
        duration: '2h 35m',
        stops: 'Non-stop',
        price: 6850,
        currency: '₹',
        cabinClass: 'Premium Economy',
        baggageAllowance: `${20 + extraLuggage}kg Check-in + 10kg Cabin`,
        tag: 'Fastest',
        formattedSummary: `Vistara UK-852 (${originCode} 11:45 → ${destCode} 14:20) Non-stop | ₹6,850 | Premium Eco`,
        boardingTime: `${startDate}T09:45`,
        landingTime: `${startDate}T14:20`,
        returnFlightTime: `${endDate}T20:15`
      },
      {
        id: 'FL-104',
        airline: 'Akasa Air',
        airlineCode: 'QP',
        airlineLogo: '✈️',
        flightNumber: 'QP-1304',
        aircraft: 'Boeing 737 MAX 8',
        origin: `${originCode} - Terminal 1`,
        originCode: originCode,
        destination: `${destCode} - Terminal 1`,
        destinationCode: destCode,
        departureTime: '14:30',
        arrivalTime: '17:10',
        duration: '2h 40m',
        stops: 'Non-stop',
        price: 4890,
        currency: '₹',
        cabinClass: 'Economy Saver',
        baggageAllowance: `${15 + extraLuggage}kg Check-in + 7kg Cabin`,
        tag: 'Lowest Fare',
        formattedSummary: `Akasa Air QP-1304 (${originCode} 14:30 → ${destCode} 17:10) Non-stop | ₹4,890 | Saver`,
        boardingTime: `${startDate}T12:30`,
        landingTime: `${startDate}T17:10`,
        returnFlightTime: `${endDate}T21:00`
      },
      {
        id: 'FL-105',
        airline: 'IndiGo',
        airlineCode: '6E',
        airlineLogo: '✈️',
        flightNumber: '6E-6118',
        aircraft: 'Airbus A320neo',
        origin: `${originCode} - Terminal 3`,
        originCode: originCode,
        destination: `${destCode} - Terminal 2`,
        destinationCode: destCode,
        departureTime: '18:20',
        arrivalTime: '21:00',
        duration: '2h 40m',
        stops: 'Non-stop',
        price: 5980,
        currency: '₹',
        cabinClass: 'Economy (Corporate Flex)',
        baggageAllowance: `${15 + extraLuggage}kg Check-in + 7kg Cabin`,
        tag: 'Evening Direct',
        formattedSummary: `IndiGo 6E-6118 (${originCode} 18:20 → ${destCode} 21:00) Non-stop | ₹5,980 | Flex`,
        boardingTime: `${startDate}T16:20`,
        landingTime: `${startDate}T21:00`,
        returnFlightTime: `${endDate}T22:30`
      }
    ];
  }

  /**
   * Client-side fallback for return flights
   */
  private getFallbackReturnFlightSuggestions(
    from: string,
    to: string = 'DEL',
    returnDate: string = '2026-09-05',
    extraLuggage: number = 0
  ): FlightSuggestion[] {
    const fromCode = this.resolveAirportCode(from);
    const toCode = to.toUpperCase() || 'DEL';
    const validDate = returnDate || '2026-09-05';

    return [
      {
        id: 'RF-201',
        airline: 'IndiGo',
        airlineCode: '6E',
        airlineLogo: '✈️',
        flightNumber: '6E-6119',
        aircraft: 'Airbus A320neo',
        origin: `${fromCode} - Terminal 2`,
        originCode: fromCode,
        destination: `${toCode} - Terminal 3`,
        destinationCode: toCode,
        departureTime: '07:00',
        arrivalTime: '09:35',
        duration: '2h 35m',
        stops: 'Non-stop',
        price: 5450,
        currency: '₹',
        cabinClass: 'Economy (Corporate Flex)',
        baggageAllowance: `${15 + extraLuggage}kg Check-in + 7kg Cabin`,
        tag: 'Early Return',
        formattedSummary: `IndiGo 6E-6119 (${fromCode} 07:00 → ${toCode} 09:35) Non-stop | ₹5,450 | Flex`,
        boardingTime: `${validDate}T05:00`,
        landingTime: `${validDate}T09:35`,
        returnFlightTime: `${validDate}T09:35`
      },
      {
        id: 'RF-202',
        airline: 'Air India',
        airlineCode: 'AI',
        airlineLogo: '🛩️',
        flightNumber: 'AI-805',
        aircraft: 'Boeing 787-8 Dreamliner',
        origin: `${fromCode} - Terminal 2`,
        originCode: fromCode,
        destination: `${toCode} - Terminal 3`,
        destinationCode: toCode,
        departureTime: '10:30',
        arrivalTime: '13:15',
        duration: '2h 45m',
        stops: 'Non-stop',
        price: 5100,
        currency: '₹',
        cabinClass: 'Economy (Complimentary Meal)',
        baggageAllowance: `${25 + extraLuggage}kg Check-in + 7kg Cabin`,
        tag: 'Best Value Return',
        formattedSummary: `Air India AI-805 (${fromCode} 10:30 → ${toCode} 13:15) Non-stop | ₹5,100 | Meal`,
        boardingTime: `${validDate}T08:30`,
        landingTime: `${validDate}T13:15`,
        returnFlightTime: `${validDate}T13:15`
      },
      {
        id: 'RF-203',
        airline: 'Vistara',
        airlineCode: 'UK',
        airlineLogo: '🛫',
        flightNumber: 'UK-853',
        aircraft: 'Airbus A321neo',
        origin: `${fromCode} - Terminal 2`,
        originCode: fromCode,
        destination: `${toCode} - Terminal 3`,
        destinationCode: toCode,
        departureTime: '14:00',
        arrivalTime: '16:35',
        duration: '2h 35m',
        stops: 'Non-stop',
        price: 6700,
        currency: '₹',
        cabinClass: 'Premium Economy',
        baggageAllowance: `${20 + extraLuggage}kg Check-in + 10kg Cabin`,
        tag: 'Premium Return',
        formattedSummary: `Vistara UK-853 (${fromCode} 14:00 → ${toCode} 16:35) Non-stop | ₹6,700 | Premium`,
        boardingTime: `${validDate}T12:00`,
        landingTime: `${validDate}T16:35`,
        returnFlightTime: `${validDate}T16:35`
      },
      {
        id: 'RF-204',
        airline: 'Akasa Air',
        airlineCode: 'QP',
        airlineLogo: '✈️',
        flightNumber: 'QP-1305',
        aircraft: 'Boeing 737 MAX 8',
        origin: `${fromCode} - Terminal 1`,
        originCode: fromCode,
        destination: `${toCode} - Terminal 1`,
        destinationCode: toCode,
        departureTime: '17:15',
        arrivalTime: '19:55',
        duration: '2h 40m',
        stops: 'Non-stop',
        price: 4750,
        currency: '₹',
        cabinClass: 'Economy Saver',
        baggageAllowance: `${15 + extraLuggage}kg Check-in + 7kg Cabin`,
        tag: 'Budget Return',
        formattedSummary: `Akasa Air QP-1305 (${fromCode} 17:15 → ${toCode} 19:55) Non-stop | ₹4,750 | Saver`,
        boardingTime: `${validDate}T15:15`,
        landingTime: `${validDate}T19:55`,
        returnFlightTime: `${validDate}T19:55`
      }
    ];
  }

  private resolveAirportCode(destination: string): string {
    if (!destination) return 'BLR';
    const d = destination.toUpperCase();
    if (d.includes('MUMBAI') || d.includes('BOM')) return 'BOM';
    if (d.includes('DELHI') || d.includes('DEL')) return 'DEL';
    if (d.includes('HYDERABAD') || d.includes('HYD')) return 'HYD';
    if (d.includes('CHENNAI') || d.includes('MAA')) return 'MAA';
    if (d.includes('PUNE') || d.includes('PNQ')) return 'PNQ';
    if (d.includes('KOLKATA') || d.includes('CCU')) return 'CCU';
    if (d.includes('GOA') || d.includes('GOI')) return 'GOI';
    if (d.includes('DUBAI') || d.includes('DXB')) return 'DXB';
    if (d.includes('LONDON') || d.includes('LHR')) return 'LHR';
    if (d.includes('SINGAPORE') || d.includes('SIN')) return 'SIN';
    if (d.includes('FRANCISCO') || d.includes('SFO')) return 'SFO';
    if (d.includes('YORK') || d.includes('JFK')) return 'JFK';
    return 'BLR';
  }
}
