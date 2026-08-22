import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TripService } from '../../../core/services/trip.service';
import { FlightService } from '../../../core/services/flight.service';
import { TripRequest, Itinerary, ChecklistTimeline, FlightSuggestion, HotelSuggestion, CabSuggestion } from '../../../core/models/models';

@Component({
  selector: 'app-travel-desk-dashboard',
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">✈</div>
          <span class="sidebar-brand-text">TravelOS</span>
        </div>
        <nav class="sidebar-nav">
          <button class="sidebar-link" [class.active]="view === 'approved'" (click)="view = 'approved'; loadApproved()">
            <span class="sidebar-link-icon">✅</span> Approved Requests
            <span class="sidebar-badge" *ngIf="approvedCount > 0">{{ approvedCount }}</span>
          </button>
          <button class="sidebar-link" [class.active]="view === 'active'" (click)="view = 'active'; loadActive()">
            <span class="sidebar-link-icon">🔄</span> Active Trips
          </button>
        </nav>
        <div class="sidebar-footer">
          <button class="sidebar-link text-danger" (click)="authService.logout()">
            <span class="sidebar-link-icon">↪</span> Sign Out
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="page-header animate-fade-in flex justify-between items-center">
          <div>
            <h2>{{ view === 'approved' ? 'Approved Requests' : 'Active Trips' }}</h2>
            <p class="text-secondary">Travel Desk Flight & Logistics Management</p>
          </div>
          <div *ngIf="view === 'approved'" class="text-xs text-secondary font-medium">
            💡 Flight suggestions automatically matched to employee destination
          </div>
        </div>

        <div class="animate-fade-in">
          <!-- Trips Grid -->
          <div class="displayed-trips-grid" *ngIf="displayedTrips.length > 0">
            <div *ngFor="let trip of displayedTrips" class="card trip-card p-6 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h4 class="text-lg font-bold">{{ trip.destination }}</h4>
                    <span class="text-xs text-tertiary">Trip #{{ trip.id }} · {{ trip.projectNo }}</span>
                  </div>
                  <span class="badge" [ngClass]="trip.status === 'APPROVED' ? 'badge-approved' : 'badge-active'">{{ trip.status }}</span>
                </div>
                
                <div class="trip-meta-box p-3 rounded-md mb-3 mt-2 bg-primary">
                  <p class="text-secondary text-xs">Employee: <strong>{{ trip.employeeName }}</strong></p>
                  <p class="text-secondary text-xs mt-1">Dates: <strong>{{ trip.startDate }} → {{ trip.endDate }}</strong></p>
                  <p class="text-secondary text-xs mt-1" *ngIf="trip.extraLuggageKg">Extra Luggage: <strong>+{{ trip.extraLuggageKg }} kg</strong></p>
                  <p class="text-secondary text-xs mt-1" *ngIf="trip.remarks">Remarks: <em>{{ trip.remarks }}</em></p>
                </div>

                <div class="flex gap-2 text-xs mb-3">
                  <span class="tag" *ngIf="trip.needsFlight">✈️ Flight Required</span>
                  <span class="tag" *ngIf="trip.needsHotel">🏨 Hotel Required</span>
                  <span class="tag" *ngIf="trip.needsCab">🚖 Cab Required</span>
                </div>
              </div>

              <div class="flex gap-2 mt-2 pt-3 border-t flex-wrap">
                <!-- Flight Suggestions Pop-up trigger -->
                <button *ngIf="trip.status === 'APPROVED'" class="btn btn-sm btn-apple-ghost flex-1" (click)="openFlightSuggestionsModal(trip)">
                  ✈️ Outbound Flights
                </button>
                <button *ngIf="trip.status === 'APPROVED'" class="btn btn-sm btn-apple-ghost-return flex-1" (click)="openReturnFlightSuggestionsModal(trip)">
                  🔄 Return Flights
                </button>
                <button *ngIf="trip.status === 'APPROVED'" class="btn btn-sm btn-primary flex-1" (click)="openItineraryModal(trip)">
                  📝 Build Itinerary
                </button>
                <button class="btn btn-sm btn-apple-ghost flex-1" (click)="openTripDetailsModal(trip)">
                  🔍 Complete Details
                </button>
                <button *ngIf="trip.status === 'ACTIVE' && !trip.itinerary?.assetsReturned" class="btn btn-sm btn-secondary flex-1" (click)="markReturned(trip)" [disabled]="trip.id === returningId">
                  {{ trip.id === returningId ? 'Updating...' : '🔄 Mark Assets Returned' }}
                </button>
                <span *ngIf="trip.status === 'ACTIVE' && trip.itinerary?.assetsReturned" class="badge badge-approved p-2 text-xs w-full text-center">
                  ✓ Assets Marked Returned
                </span>
              </div>
            </div>
          </div>

          <div *ngIf="displayedTrips.length === 0" class="card p-12 text-center">
            <div class="text-4xl mb-2">✈️</div>
            <p class="text-secondary">No requests to display in this category.</p>
          </div>
        </div>
      </main>
    </div>

    <!-- =======================================================
         Apple Website Style Minimal Centered Flight Suggestions Modal
         ======================================================= -->
    <div class="modal-overlay" [class.active]="showFlightModal" (click)="showFlightModal = false">
      <div class="modal-container modal-container-lg apple-glass-modal" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="modal-header">
          <div>
            <div class="flex items-center gap-2">
              <span class="apple-flight-icon">✈️</span>
              <h3 class="modal-title">Flight Suggestions for {{ selectedTrip?.destination }}</h3>
            </div>
            <p class="text-secondary text-xs mt-1" *ngIf="selectedTrip">
              Employee: <strong>{{ selectedTrip.employeeName }}</strong> · Travel: <strong>{{ selectedTrip.startDate }} → {{ selectedTrip.endDate }}</strong>
              <span *ngIf="selectedTrip.extraLuggageKg"> · Extra Luggage: <strong>+{{ selectedTrip.extraLuggageKg }}kg</strong></span>
            </p>
          </div>
          <button class="modal-close" (click)="showFlightModal = false">✕</button>
        </div>

        <div class="modal-body">
          <!-- Segmented Filter Pills -->
          <div class="apple-segmented-bar">
            <button class="apple-segment-pill" [class.active]="flightFilter === 'all'" (click)="flightFilter = 'all'">All ({{ flightSuggestions.length }})</button>
            <button class="apple-segment-pill" [class.active]="flightFilter === 'preferred'" (click)="flightFilter = 'preferred'">Corporate Preferred</button>
            <button class="apple-segment-pill" [class.active]="flightFilter === 'nonstop'" (click)="flightFilter = 'nonstop'">Non-stop</button>
            <button class="apple-segment-pill" [class.active]="flightFilter === 'lowest'" (click)="flightFilter = 'lowest'">Lowest Fare</button>
          </div>

          <!-- Loading State -->
          <div *ngIf="flightSuggestionsLoading" class="p-8 text-center">
            <div class="spinner spinner-lg mb-3"></div>
            <p class="text-secondary text-sm">Searching corporate flight network for {{ selectedTrip?.destination }}...</p>
          </div>

          <!-- Flight List -->
          <div *ngIf="!flightSuggestionsLoading" class="flex flex-col gap-3">
            <div *ngFor="let flight of getFilteredFlights()" class="flight-item-card p-4 transition-all">
              <div class="flex justify-between items-start flex-wrap gap-2">
                <!-- Airline & Code -->
                <div class="flex items-center gap-3">
                  <div class="airline-avatar">{{ flight.airlineLogo }}</div>
                  <div>
                    <div class="flex items-center gap-2">
                      <strong class="text-sm">{{ flight.airline }}</strong>
                      <span class="flight-code-badge">{{ flight.flightNumber }}</span>
                    </div>
                    <span class="text-xs text-tertiary">{{ flight.aircraft }} · {{ flight.cabinClass }}</span>
                  </div>
                </div>

                <!-- Price & Tag -->
                <div class="text-right">
                  <div class="text-base font-bold text-accent">{{ flight.currency }}{{ flight.price | number }}</div>
                  <span class="tag-pill" *ngIf="flight.tag">{{ flight.tag }}</span>
                </div>
              </div>

              <!-- Route Schedule Timeline -->
              <div class="flight-route-strip my-3 p-3 rounded-lg flex items-center justify-between">
                <div class="text-left">
                  <div class="flight-time-large">{{ flight.departureTime }}</div>
                  <div class="text-xs text-secondary">{{ flight.originCode }}</div>
                </div>

                <div class="flex-1 mx-4 text-center">
                  <div class="text-xs text-secondary font-medium">{{ flight.duration }}</div>
                  <div class="flight-line">
                    <span class="flight-dot"></span>
                    <span class="flight-plane-icon">✈</span>
                    <span class="flight-dot"></span>
                  </div>
                  <div class="text-xs text-success font-medium">{{ flight.stops }}</div>
                </div>

                <div class="text-right">
                  <div class="flight-time-large">{{ flight.arrivalTime }}</div>
                  <div class="text-xs text-secondary">{{ flight.destinationCode }}</div>
                </div>
              </div>

              <!-- Baggage & Action -->
              <div class="flex justify-between items-center pt-2 border-t flex-wrap gap-2">
                <span class="text-xs text-secondary">
                  🧳 Baggage: <strong>{{ flight.baggageAllowance }}</strong>
                </span>
                <button class="btn btn-sm btn-primary btn-apple-action" (click)="applyFlightToItinerary(flight)">
                  ⚡ Select & Pre-fill Itinerary
                </button>
              </div>
            </div>

            <div *ngIf="getFilteredFlights().length === 0" class="card p-6 text-center text-secondary text-sm">
              No flights match the selected filter.
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" (click)="showFlightModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- =======================================================
         Apple Website Style Return Flight Suggestions Modal
         ======================================================= -->
    <div class="modal-overlay" [class.active]="showReturnFlightModal" (click)="showReturnFlightModal = false">
      <div class="modal-container modal-container-lg apple-glass-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <div class="flex items-center gap-2">
              <span class="return-flight-icon">🔄</span>
              <h3 class="modal-title">Return Flights · {{ selectedTrip?.destination }} → Home</h3>
            </div>
            <p class="text-secondary text-xs mt-1" *ngIf="selectedTrip">
              Employee: <strong>{{ selectedTrip.employeeName }}</strong> · Return Date: <strong>{{ selectedTrip.endDate }}</strong>
              <span *ngIf="selectedTrip.extraLuggageKg"> · Extra Luggage: <strong>+{{ selectedTrip.extraLuggageKg }}kg</strong></span>
            </p>
          </div>
          <button class="modal-close" (click)="showReturnFlightModal = false">✕</button>
        </div>

        <div class="modal-body">
          <!-- Segmented Filter Pills -->
          <div class="apple-segmented-bar">
            <button class="apple-segment-pill" [class.active]="returnFlightFilter === 'all'" (click)="returnFlightFilter = 'all'">All ({{ returnFlightSuggestions.length }})</button>
            <button class="apple-segment-pill" [class.active]="returnFlightFilter === 'early'" (click)="returnFlightFilter = 'early'">Early Return</button>
            <button class="apple-segment-pill" [class.active]="returnFlightFilter === 'lowest'" (click)="returnFlightFilter = 'lowest'">Lowest Fare</button>
          </div>

          <!-- Loading -->
          <div *ngIf="returnFlightLoading" class="p-8 text-center">
            <div class="spinner spinner-lg mb-3"></div>
            <p class="text-secondary text-sm">Searching return flights from {{ selectedTrip?.destination }}...</p>
          </div>

          <!-- Return Flight List -->
          <div *ngIf="!returnFlightLoading" class="flex flex-col gap-3">
            <div *ngFor="let flight of getFilteredReturnFlights()" class="flight-item-card return-flight-card p-4 transition-all">
              <div class="flex justify-between items-start flex-wrap gap-2">
                <div class="flex items-center gap-3">
                  <div class="airline-avatar return-avatar">{{ flight.airlineLogo }}</div>
                  <div>
                    <div class="flex items-center gap-2">
                      <strong class="text-sm">{{ flight.airline }}</strong>
                      <span class="flight-code-badge">{{ flight.flightNumber }}</span>
                      <span class="return-badge-pill">RETURN</span>
                    </div>
                    <span class="text-xs text-tertiary">{{ flight.aircraft }} · {{ flight.cabinClass }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-base font-bold text-return-accent">{{ flight.currency }}{{ flight.price | number }}</div>
                  <span class="tag-pill return-tag" *ngIf="flight.tag">{{ flight.tag }}</span>
                </div>
              </div>

              <div class="flight-route-strip return-route-strip my-3 p-3 rounded-lg flex items-center justify-between">
                <div class="text-left">
                  <div class="flight-time-large">{{ flight.departureTime }}</div>
                  <div class="text-xs text-secondary">{{ flight.originCode }}</div>
                </div>
                <div class="flex-1 mx-4 text-center">
                  <div class="text-xs text-secondary font-medium">{{ flight.duration }}</div>
                  <div class="flight-line return-line">
                    <span class="flight-dot"></span>
                    <span class="flight-plane-icon return-plane">✈</span>
                    <span class="flight-dot"></span>
                  </div>
                  <div class="text-xs text-success font-medium">{{ flight.stops }}</div>
                </div>
                <div class="text-right">
                  <div class="flight-time-large">{{ flight.arrivalTime }}</div>
                  <div class="text-xs text-secondary">{{ flight.destinationCode }}</div>
                </div>
              </div>

              <div class="flex justify-between items-center pt-2 border-t flex-wrap gap-2">
                <span class="text-xs text-secondary">🧳 Baggage: <strong>{{ flight.baggageAllowance }}</strong></span>
                <button class="btn btn-sm btn-primary btn-return-action" (click)="applyReturnFlightToItinerary(flight)">
                  ⚡ Select Return Flight
                </button>
              </div>
            </div>

            <div *ngIf="getFilteredReturnFlights().length === 0" class="card p-6 text-center text-secondary text-sm">
              No return flights match the selected filter.
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" (click)="showReturnFlightModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- =======================================================
         Itinerary & Timeline Modal (With Smart Suggestions Bar)
         ======================================================= -->
    <div class="modal-overlay" [class.active]="showItineraryModal" (click)="closeItineraryModal()">
      <div class="modal-container modal-container-md apple-glass-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Build Itinerary & Timeline</h3>
            <p class="text-xs text-secondary mt-1" *ngIf="selectedTrip">Trip #{{ selectedTrip.id }} · {{ selectedTrip.destination }}</p>
          </div>
          <button class="modal-close" (click)="closeItineraryModal()">✕</button>
        </div>

        <div class="modal-body" style="max-height: 72vh; overflow-y: auto;">
          <!-- Trip Summary Bar -->
          <div class="trip-summary-bar" *ngIf="selectedTrip">
            <span>🧑‍💼 {{ selectedTrip.employeeName }}</span>
            <span>📍 {{ selectedTrip.destination }}</span>
            <span>📅 {{ selectedTrip.startDate }} → {{ selectedTrip.endDate }}</span>
          </div>

          <!-- Applied Flight Flash Notification -->
          <div *ngIf="appliedFlightNotice" class="applied-flight-banner p-3 rounded-lg mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="checkmark-icon">✓</span>
              <span class="text-xs font-semibold text-success">{{ appliedFlightNotice }}</span>
            </div>
            <button class="btn-xs-text" (click)="appliedFlightNotice = ''">✕</button>
          </div>

          <!-- Smart Flight Recommendation Mini-Carousel -->
          <div class="smart-flight-bar p-4 rounded-xl mb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                <span>✈️</span> Suggested Flights for {{ selectedTrip?.destination }}
              </span>
              <button class="btn btn-xs btn-ghost text-accent font-semibold" (click)="openFlightSuggestionsModal(selectedTrip!)">
                🔍 Browse All ({{ flightSuggestions.length }})
              </button>
            </div>
            
            <div class="quick-flights-scroll flex gap-2 overflow-x-auto pb-1">
              <div *ngFor="let f of flightSuggestions.slice(0, 3)" class="quick-flight-chip p-2 rounded-lg cursor-pointer flex-1" (click)="applyFlightToItinerary(f)">
                <div class="flex justify-between items-center text-xs">
                  <strong>{{ f.airline }} {{ f.flightNumber }}</strong>
                  <span class="text-accent font-bold">{{ f.currency }}{{ f.price | number }}</span>
                </div>
                <div class="text-xs text-secondary mt-1 flex justify-between">
                  <span>{{ f.departureTime }} → {{ f.arrivalTime }}</span>
                  <span class="text-success">{{ f.stops }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Itinerary Section with Minimal Translucent Dropdown Autocompletes -->
          <div class="section-label">✈️ Outbound Booking Details</div>
          
          <div class="form-group">
            <label class="form-label">PNR / Ticket No</label>
            <input class="form-input" [(ngModel)]="itinerary.pnr" placeholder="e.g. 6E-IND9421" />
          </div>

          <!-- Flight Details with Apple Floating Autocomplete -->
          <div class="form-group apple-autocomplete-wrap">
            <label class="form-label flex justify-between">
              <span>Outbound Flight</span>
              <span class="text-xs text-accent cursor-pointer" (click)="showFlightDropdown = !showFlightDropdown">
                {{ showFlightDropdown ? 'Hide Suggestions' : 'Show Suggestions' }}
              </span>
            </label>
            <input
              class="form-input"
              [(ngModel)]="itinerary.flightDetails"
              placeholder="e.g. IndiGo 6E-2041 (DEL 06:15 → BLR 08:50)"
              (focus)="showFlightDropdown = true"
              (input)="onFlightInput()"
            />
            
            <!-- Translucent Floating Flight Suggestions Dropdown -->
            <div *ngIf="showFlightDropdown && filteredFlightDropdown.length > 0" class="apple-autocomplete-dropdown">
              <div class="apple-dropdown-header">
                <span>Suggested Outbound Flights for {{ selectedTrip?.destination }}</span>
                <span class="text-xs text-secondary">{{ filteredFlightDropdown.length }} options</span>
              </div>
              <div *ngFor="let f of filteredFlightDropdown" class="apple-dropdown-item" (click)="selectFlightFromDropdown(f)">
                <div class="apple-dropdown-left">
                  <div class="apple-dropdown-icon">{{ f.airlineLogo }}</div>
                  <div>
                    <div class="apple-dropdown-title">{{ f.airline }} {{ f.flightNumber }} ({{ f.departureTime }} - {{ f.arrivalTime }})</div>
                    <div class="apple-dropdown-subtitle">{{ f.stops }} · {{ f.cabinClass }} · Baggage: {{ f.baggageAllowance }}</div>
                  </div>
                </div>
                <div class="apple-dropdown-right">
                  <span class="apple-dropdown-badge">{{ f.currency }}{{ f.price | number }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══════════════ Return Flight Section ═══════════════ -->
          <div class="section-divider"></div>
          <div class="section-label return-section-label">🔄 Return Flight</div>

          <!-- Smart Return Flight Recommendation Mini-Carousel -->
          <div class="smart-flight-bar return-smart-bar p-4 rounded-xl mb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-return-accent flex items-center gap-1">
                <span>🔄</span> Return Flights · {{ selectedTrip?.destination }} → Home
              </span>
              <button class="btn btn-xs btn-ghost text-return-accent font-semibold" (click)="openReturnFlightSuggestionsModal(selectedTrip!)">
                🔍 Browse All ({{ returnFlightSuggestions.length }})
              </button>
            </div>
            
            <div class="quick-flights-scroll flex gap-2 overflow-x-auto pb-1">
              <div *ngFor="let f of returnFlightSuggestions.slice(0, 3)" class="quick-flight-chip return-chip p-2 rounded-lg cursor-pointer flex-1" (click)="applyReturnFlightToItinerary(f)">
                <div class="flex justify-between items-center text-xs">
                  <strong>{{ f.airline }} {{ f.flightNumber }}</strong>
                  <span class="text-return-accent font-bold">{{ f.currency }}{{ f.price | number }}</span>
                </div>
                <div class="text-xs text-secondary mt-1 flex justify-between">
                  <span>{{ f.departureTime }} → {{ f.arrivalTime }}</span>
                  <span class="text-success">{{ f.stops }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Return Flight Details with Apple Autocomplete -->
          <div class="form-group apple-autocomplete-wrap">
            <label class="form-label flex justify-between">
              <span>Return Flight Details</span>
              <span class="text-xs text-return-accent cursor-pointer" (click)="showReturnFlightDropdown = !showReturnFlightDropdown">
                {{ showReturnFlightDropdown ? 'Hide Return Suggestions' : 'Show Return Suggestions' }}
              </span>
            </label>
            <input
              class="form-input return-input"
              [(ngModel)]="returnFlightDetails"
              placeholder="e.g. IndiGo 6E-6119 (BLR 07:00 → DEL 09:35)"
              (focus)="showReturnFlightDropdown = true"
              (input)="onReturnFlightInput()"
            />
            
            <div *ngIf="showReturnFlightDropdown && filteredReturnFlightDropdown.length > 0" class="apple-autocomplete-dropdown return-dropdown">
              <div class="apple-dropdown-header return-dropdown-header">
                <span>🔄 Return Flights from {{ selectedTrip?.destination }}</span>
                <span class="text-xs text-secondary">{{ filteredReturnFlightDropdown.length }} options</span>
              </div>
              <div *ngFor="let f of filteredReturnFlightDropdown" class="apple-dropdown-item" (click)="selectReturnFlightFromDropdown(f)">
                <div class="apple-dropdown-left">
                  <div class="apple-dropdown-icon">{{ f.airlineLogo }}</div>
                  <div>
                    <div class="apple-dropdown-title">{{ f.airline }} {{ f.flightNumber }} ({{ f.departureTime }} - {{ f.arrivalTime }})</div>
                    <div class="apple-dropdown-subtitle">{{ f.stops }} · {{ f.cabinClass }} · {{ f.tag }}</div>
                  </div>
                </div>
                <div class="apple-dropdown-right">
                  <span class="apple-dropdown-badge return-badge">{{ f.currency }}{{ f.price | number }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Applied Return Flight Notice -->
          <div *ngIf="appliedReturnFlightNotice" class="applied-flight-banner return-banner p-3 rounded-lg mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="checkmark-icon return-checkmark">✓</span>
              <span class="text-xs font-semibold text-return-accent">{{ appliedReturnFlightNotice }}</span>
            </div>
            <button class="btn-xs-text" (click)="appliedReturnFlightNotice = ''">✕</button>
          </div>

          <!-- Hotel Name with Apple Autocomplete -->
          <div class="form-group apple-autocomplete-wrap">
            <label class="form-label flex justify-between">
              <span>Hotel Name</span>
              <span class="text-xs text-tertiary">Corporate Luxury Partners</span>
            </label>
            <input
              class="form-input"
              [(ngModel)]="itinerary.hotelName"
              placeholder="e.g. The Oberoi / Taj West End"
              (focus)="showHotelDropdown = true"
              (input)="onHotelInput()"
            />

            <!-- Translucent Floating Hotel Suggestions Dropdown -->
            <div *ngIf="showHotelDropdown && filteredHotels.length > 0" class="apple-autocomplete-dropdown">
              <div class="apple-dropdown-header">
                <span>Top Hotels in {{ selectedTrip?.destination }}</span>
              </div>
              <div *ngFor="let h of filteredHotels" class="apple-dropdown-item" (click)="selectHotelFromDropdown(h)">
                <div class="apple-dropdown-left">
                  <div class="apple-dropdown-icon">🏨</div>
                  <div>
                    <div class="apple-dropdown-title">{{ h.name }}</div>
                    <div class="apple-dropdown-subtitle">{{ h.address }}</div>
                  </div>
                </div>
                <div class="apple-dropdown-right">
                  <span class="apple-dropdown-badge">{{ h.rating }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Hotel Address</label>
            <input class="form-input" [(ngModel)]="itinerary.hotelAddress" placeholder="Hotel complete address & landmark" />
          </div>

          <!-- Cab Driver & Vehicle with Apple Autocomplete -->
          <div class="grid-2-col">
            <div class="form-group apple-autocomplete-wrap">
              <label class="form-label flex justify-between">
                <span>Cab Driver Name</span>
                <span class="text-xs text-tertiary">Fleet Roster</span>
              </label>
              <input
                class="form-input"
                [(ngModel)]="itinerary.cabDriverName"
                placeholder="Driver full name"
                (focus)="showCabDropdown = true"
                (input)="onCabInput()"
              />

              <!-- Translucent Cab Dropdown -->
              <div *ngIf="showCabDropdown && filteredCabs.length > 0" class="apple-autocomplete-dropdown">
                <div class="apple-dropdown-header">
                  <span>Pre-approved Corporate Chauffeurs</span>
                </div>
                <div *ngFor="let c of filteredCabs" class="apple-dropdown-item" (click)="selectCabFromDropdown(c)">
                  <div class="apple-dropdown-left">
                    <div class="apple-dropdown-icon">🚕</div>
                    <div>
                      <div class="apple-dropdown-title">{{ c.driverName }} ({{ c.provider }})</div>
                      <div class="apple-dropdown-subtitle">{{ c.vehicleModel }} · {{ c.vehicleNumber }}</div>
                    </div>
                  </div>
                  <div class="apple-dropdown-right">
                    <span class="apple-dropdown-badge">{{ c.rating }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Cab Number</label>
              <input class="form-input" [(ngModel)]="itinerary.cabNumber" placeholder="e.g. KA-01-MJ-4521" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Allocated Assets</label>
            <input class="form-input" [(ngModel)]="itinerary.allocatedAssets" placeholder="e.g. Corporate Laptop, WiFi Dongle, Forex Card" />
          </div>

          <!-- Timeline Section -->
          <div class="section-divider"></div>
          <div class="section-label">🕐 Checklist Timeline</div>
          <p class="section-hint">Auto-calculated milestones synchronized with flight schedules. Customize as needed.</p>

          <div class="timeline-inputs">
            <div class="form-group">
              <label class="form-label">✈️ Flight Boarding</label>
              <input class="form-input" type="datetime-local" [(ngModel)]="timeline.flightBoardingTime" />
            </div>
            <div class="form-group">
              <label class="form-label">🛬 Flight Landing</label>
              <input class="form-input" type="datetime-local" [(ngModel)]="timeline.flightLandingTime" />
            </div>
            <div class="form-group">
              <label class="form-label">🚕 Cab Pickup</label>
              <input class="form-input" type="datetime-local" [(ngModel)]="timeline.cabPickupTime" />
            </div>
            <div class="form-group">
              <label class="form-label">🏨 Hotel Check-In</label>
              <input class="form-input" type="datetime-local" [(ngModel)]="timeline.hotelCheckinTime" />
            </div>
            <div class="form-group">
              <label class="form-label">🧳 Hotel Check-Out</label>
              <input class="form-input" type="datetime-local" [(ngModel)]="timeline.hotelCheckoutTime" />
            </div>
            <div class="form-group">
              <label class="form-label">🛫 Return Flight</label>
              <input class="form-input" type="datetime-local" [(ngModel)]="timeline.returnFlightTime" />
            </div>
            <div class="form-group">
              <label class="form-label">🏠 Journey End</label>
              <input class="form-input" type="datetime-local" [(ngModel)]="timeline.journeyEndTime" />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeItineraryModal()">Cancel</button>
          <button class="btn btn-primary" (click)="submitItinerary()" [disabled]="itineraryLoading">
            {{ itineraryLoading ? 'Saving...' : 'Save & Activate Trip' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Travel Desk Complete End-to-End Trip Details Modal -->
    <div class="modal-overlay" [class.active]="showCompleteDetailsModal" (click)="showCompleteDetailsModal = false">
      <div class="modal-container modal-container-lg" (click)="$event.stopPropagation()" style="max-width: 780px;">
        <div class="modal-header">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl">🗂️</span>
              <h3 class="modal-title">Trip #{{ selectedTrip?.id }} · Complete End-to-End Itinerary & Status</h3>
            </div>
            <p class="text-xs text-secondary mt-1">Employee: <strong>{{ selectedTrip?.employeeName }}</strong> · Destination: <strong>{{ selectedTrip?.destination }}</strong></p>
          </div>
          <button class="modal-close" (click)="showCompleteDetailsModal = false">✕</button>
        </div>
        
        <div class="modal-body" *ngIf="selectedTrip" style="max-height: 76vh; overflow-y: auto;">
          <!-- 1. Executive Summary -->
          <div class="p-4 rounded-xl mb-4 bg-primary border" style="border-color: var(--border-light);">
            <div class="flex justify-between items-start flex-wrap gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-lg font-bold">{{ selectedTrip.destination }}</h4>
                  <span class="badge" [ngClass]="selectedTrip.status === 'APPROVED' ? 'badge-approved' : 'badge-active'">{{ selectedTrip.status }}</span>
                </div>
                <p class="text-xs text-secondary mt-1">
                  Project: <strong>{{ selectedTrip.projectNo }}</strong> · Client ID: <strong>{{ selectedTrip.clientId }}</strong>
                  <span *ngIf="selectedTrip.employeeName"> · Employee: <strong>{{ selectedTrip.employeeName }}</strong> ({{ selectedTrip.employeeEmpId }})</span>
                </p>
              </div>
              <div class="text-right">
                <div class="text-xs text-tertiary">Estimated Budget</div>
                <div class="text-base font-bold text-accent">₹{{ selectedTrip.estimatedCost | number }}</div>
              </div>
            </div>

            <div class="grid-3-col mt-3 pt-3 border-t text-xs">
              <div>
                <span class="text-tertiary">📅 Travel Dates:</span>
                <p class="font-semibold mt-0.5">{{ selectedTrip.startDate }} → {{ selectedTrip.endDate }}</p>
              </div>
              <div>
                <span class="text-tertiary">🧳 Extra Luggage:</span>
                <p class="font-semibold mt-0.5">{{ selectedTrip.extraLuggageKg ? '+' + selectedTrip.extraLuggageKg + ' kg Authorized' : 'Standard' }}</p>
              </div>
              <div>
                <span class="text-tertiary">⚙️ Requested Services:</span>
                <p class="font-semibold mt-0.5">
                  <span *ngIf="selectedTrip.needsFlight">✈️ Flight </span>
                  <span *ngIf="selectedTrip.needsHotel">🏨 Hotel </span>
                  <span *ngIf="selectedTrip.needsCab">🚕 Cab</span>
                </p>
              </div>
            </div>

            <div class="mt-2 pt-2 border-t text-xs" *ngIf="selectedTrip.remarks">
              <span class="text-tertiary">💬 Manager Approval Remarks:</span>
              <p class="italic text-secondary mt-0.5">{{ selectedTrip.remarks }}</p>
            </div>
          </div>

          <!-- 2. Full Itinerary & Booking Details -->
          <div class="section-label mb-2 font-bold text-sm">✈️ Confirmed Itinerary & Transport Logistics</div>
          
          <div class="flex flex-col gap-3 mb-4">
            <!-- Outbound Flight -->
            <div class="detail-section p-4 rounded-xl bg-primary border" style="border-color: var(--border-light);">
              <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-base">🛫</span>
                  <h4 class="text-sm font-bold text-accent">Outbound Flight Booking</h4>
                </div>
                <span class="badge badge-active text-xs" *ngIf="selectedTrip.itinerary?.pnr">PNR: {{ selectedTrip.itinerary?.pnr }}</span>
              </div>
              <div class="text-xs text-secondary leading-relaxed">
                <p><strong>Flight:</strong> {{ selectedTrip.itinerary?.flightDetails || 'Pending Booking' }}</p>
              </div>
            </div>

            <!-- Return Flight -->
            <div class="detail-section p-4 rounded-xl bg-primary border" style="border-left: 4px solid #AF52DE; border-color: var(--border-light); border-left-color: #AF52DE;">
              <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-base">🔄</span>
                  <h4 class="text-sm font-bold" style="color: #AF52DE;">Return Flight Booking</h4>
                  <span class="return-badge-pill">RETURN</span>
                </div>
                <span class="badge text-xs" style="background: rgba(175, 82, 222, 0.15); color: #AF52DE;" *ngIf="selectedTrip.itinerary?.returnPnr || selectedTrip.itinerary?.pnr">
                  PNR: {{ selectedTrip.itinerary?.returnPnr || selectedTrip.itinerary?.pnr }}
                </span>
              </div>
              <div class="text-xs text-secondary leading-relaxed">
                <p><strong>Return Details:</strong> {{ selectedTrip.itinerary?.returnFlightDetails || 'Scheduled on ' + selectedTrip.endDate + ' (Return Journey)' }}</p>
              </div>
            </div>

            <!-- Hotel Stay -->
            <div class="detail-section p-4 rounded-xl bg-primary border" style="border-color: var(--border-light);">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-base">🏨</span>
                <h4 class="text-sm font-bold text-accent">Hotel Accommodation</h4>
              </div>
              <div class="text-xs text-secondary leading-relaxed">
                <p><strong>Hotel:</strong> {{ selectedTrip.itinerary?.hotelName || 'Pending Allocation' }}</p>
                <p *ngIf="selectedTrip.itinerary?.hotelAddress" class="mt-1"><strong>Address:</strong> {{ selectedTrip.itinerary?.hotelAddress }}</p>
              </div>
            </div>

            <!-- Cab Transfer -->
            <div class="detail-section p-4 rounded-xl bg-primary border" style="border-color: var(--border-light);">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-base">🚕</span>
                <h4 class="text-sm font-bold text-accent">Dedicated Cab & Chauffeur</h4>
              </div>
              <div class="text-xs text-secondary leading-relaxed">
                <p><strong>Driver:</strong> {{ selectedTrip.itinerary?.cabDriverName || 'Pending Allocation' }}</p>
                <p *ngIf="selectedTrip.itinerary?.cabNumber" class="mt-1"><strong>Vehicle:</strong> {{ selectedTrip.itinerary?.cabNumber }}</p>
              </div>
            </div>

            <!-- Allocated Assets -->
            <div class="detail-section p-4 rounded-xl bg-primary border" style="border-color: var(--border-light);">
              <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-base">💼</span>
                  <h4 class="text-sm font-bold text-accent">Allocated Corporate Assets</h4>
                </div>
                <span class="badge" [ngClass]="selectedTrip.itinerary?.assetsReturned ? 'badge-approved' : 'badge-pending'">
                  {{ selectedTrip.itinerary?.assetsReturned ? '✓ Assets Returned' : 'In Employee Possession' }}
                </span>
              </div>
              <div class="text-xs text-secondary">
                <p><strong>Assigned Kit:</strong> {{ selectedTrip.itinerary?.allocatedAssets || 'Standard Kit' }}</p>
              </div>
            </div>
          </div>

          <!-- 3. Milestones & Timeline Table -->
          <div class="section-label mb-2 font-bold text-sm">📍 Journey Milestones & Timeline Execution</div>
          
          <div class="detail-section p-4 rounded-xl mb-4 bg-primary border" style="border-color: var(--border-light);">
            <div style="overflow-x: auto;">
              <table class="w-full text-xs" style="border-collapse: collapse;">
                <thead>
                  <tr class="border-b text-tertiary text-left">
                    <th class="py-2">Milestone</th>
                    <th class="py-2">Scheduled Time</th>
                    <th class="py-2">Actual Timestamp</th>
                    <th class="py-2">Verification Proof</th>
                    <th class="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b">
                    <td class="py-2 font-medium">🛫 Outbound Flight Boarded</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.checklistTimeline?.flightBoardingTime || selectedTrip.milestones?.scheduledTimeline?.flightBoardingTime | date:'short') || '—' }}</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.milestones?.flightBoardedAt | date:'short') || '—' }}</td>
                    <td class="py-2">{{ selectedTrip.milestones?.flightBoardedVerification || '—' }}</td>
                    <td class="py-2 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.flightBoarded ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.flightBoarded ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 font-medium">🛬 Destination Flight Landed</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.checklistTimeline?.flightLandingTime || selectedTrip.milestones?.scheduledTimeline?.flightLandingTime | date:'short') || '—' }}</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.milestones?.flightLandedAt | date:'short') || '—' }}</td>
                    <td class="py-2">{{ selectedTrip.milestones?.flightLandedVerification || '—' }}</td>
                    <td class="py-2 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.flightLanded ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.flightLanded ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 font-medium">🚕 Cab Picked Up</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.checklistTimeline?.cabPickupTime || selectedTrip.milestones?.scheduledTimeline?.cabPickupTime | date:'short') || '—' }}</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.milestones?.cabPickedUpAt | date:'short') || '—' }}</td>
                    <td class="py-2">{{ selectedTrip.milestones?.cabPickedUpVerification || '—' }}</td>
                    <td class="py-2 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.cabPickedUp ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.cabPickedUp ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 font-medium">🏨 Hotel Checked In</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.checklistTimeline?.hotelCheckinTime || selectedTrip.milestones?.scheduledTimeline?.hotelCheckinTime | date:'short') || '—' }}</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.milestones?.hotelCheckedInAt | date:'short') || '—' }}</td>
                    <td class="py-2">{{ selectedTrip.milestones?.hotelCheckedInVerification || '—' }}</td>
                    <td class="py-2 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.hotelCheckedIn ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.hotelCheckedIn ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 font-medium">🧳 Hotel Checked Out</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.checklistTimeline?.hotelCheckoutTime || selectedTrip.milestones?.scheduledTimeline?.hotelCheckoutTime | date:'short') || '—' }}</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.milestones?.hotelCheckedOutAt | date:'short') || '—' }}</td>
                    <td class="py-2">{{ selectedTrip.milestones?.hotelCheckedOutVerification || '—' }}</td>
                    <td class="py-2 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.hotelCheckedOut ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.hotelCheckedOut ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 font-medium" style="color: #AF52DE;">🛫 Return Flight Boarded</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.checklistTimeline?.returnFlightTime || selectedTrip.milestones?.scheduledTimeline?.returnFlightTime | date:'short') || '—' }}</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.milestones?.returnFlightBoardedAt | date:'short') || '—' }}</td>
                    <td class="py-2">{{ selectedTrip.milestones?.returnFlightBoardedVerification || '—' }}</td>
                    <td class="py-2 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.returnFlightBoarded ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.returnFlightBoarded ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td class="py-2 font-medium">🏠 Journey Completed</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.checklistTimeline?.journeyEndTime || selectedTrip.milestones?.scheduledTimeline?.journeyEndTime | date:'short') || '—' }}</td>
                    <td class="py-2 text-secondary">{{ (selectedTrip.milestones?.journeyEndedAt | date:'short') || '—' }}</td>
                    <td class="py-2">{{ selectedTrip.milestones?.journeyEndedVerification || '—' }}</td>
                    <td class="py-2 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.journeyEnded ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.journeyEnded ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" (click)="showCompleteDetailsModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Apple-Style Notification Toast Modal -->
    <div class="modal-overlay" [class.active]="showToastModal" (click)="showToastModal = false">
      <div class="modal-container modal-container-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">{{ toastTitle }}</h3>
          <button class="modal-close" (click)="showToastModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="text-sm text-secondary">{{ toastMessage }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary btn-sm" (click)="showToastModal = false">OK</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout { display: flex; min-height: 100vh; background: var(--bg-primary); }
    .page-header { margin-bottom: 28px; }
    .page-header h2 { font-size: 1.625rem; font-weight: 700; letter-spacing: -0.025em; }

    .sidebar-badge {
      margin-left: auto;
      background: var(--accent);
      color: white;
      font-size: 0.6875rem;
      padding: 1px 7px;
      border-radius: 9999px;
      font-weight: 700;
    }

    .displayed-trips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
      width: 100%;
    }

    .trip-meta-box {
      border: 1px solid var(--border-light);
    }

    .tag {
      background: rgba(0, 113, 227, 0.08);
      color: var(--accent);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Apple Modal Styles */
    .apple-glass-modal {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: saturate(180%) blur(28px);
      -webkit-backdrop-filter: saturate(180%) blur(28px);
      border: 1px solid rgba(255, 255, 255, 0.7);
    }

    .apple-flight-icon {
      font-size: 1.25rem;
    }

    .flight-item-card {
      background: #FFFFFF;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 14px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .flight-item-card:hover {
      transform: translateY(-2px);
      border-color: rgba(0, 113, 227, 0.3);
      box-shadow: 0 8px 24px rgba(0, 113, 227, 0.08);
    }

    .airline-avatar {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      background: rgba(0, 113, 227, 0.08);
      display: grid;
      place-items: center;
      font-size: 1.1rem;
    }

    .flight-code-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      background: rgba(0, 0, 0, 0.06);
      padding: 1px 6px;
      border-radius: 4px;
      color: var(--text-secondary);
    }

    .tag-pill {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #1A9E38;
      background: rgba(48, 209, 88, 0.12);
      padding: 2px 8px;
      border-radius: 9999px;
      display: inline-block;
      margin-top: 2px;
    }

    .flight-route-strip {
      background: var(--bg-primary);
      border: 1px solid var(--border-light);
    }

    .flight-time-large {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .flight-line {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      margin: 4px 0;
      height: 2px;
      background: var(--border-medium);
    }

    .flight-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-tertiary);
    }

    .flight-plane-icon {
      position: absolute;
      font-size: 0.75rem;
      color: var(--accent);
      background: var(--bg-primary);
      padding: 0 4px;
    }

    .btn-apple-action {
      background: var(--accent);
      color: white;
      font-weight: 600;
    }
    .btn-apple-action:hover {
      background: var(--accent-hover);
      box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3);
    }

    /* ═══════════════ Return Flight Styles ═══════════════ */
    .btn-apple-ghost-return {
      background: rgba(175, 82, 222, 0.08);
      color: #AF52DE;
      border: 1px solid rgba(175, 82, 222, 0.2);
      font-weight: 600;
      font-size: 0.8125rem;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-apple-ghost-return:hover {
      background: rgba(175, 82, 222, 0.15);
      border-color: rgba(175, 82, 222, 0.4);
      box-shadow: 0 4px 12px rgba(175, 82, 222, 0.15);
    }

    .text-return-accent { color: #AF52DE; }

    .return-flight-icon { font-size: 1.25rem; }

    .return-flight-card {
      border-left: 3px solid rgba(175, 82, 222, 0.4);
    }
    .return-flight-card:hover {
      border-color: rgba(175, 82, 222, 0.6);
      box-shadow: 0 8px 24px rgba(175, 82, 222, 0.1);
    }

    .return-avatar {
      background: rgba(175, 82, 222, 0.1);
    }

    .return-badge-pill {
      font-size: 0.5625rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #AF52DE;
      background: rgba(175, 82, 222, 0.12);
      padding: 1px 6px;
      border-radius: 4px;
    }

    .return-tag {
      color: #AF52DE;
      background: rgba(175, 82, 222, 0.12);
    }

    .return-route-strip {
      background: rgba(175, 82, 222, 0.04);
      border-color: rgba(175, 82, 222, 0.15);
    }

    .return-line { background: rgba(175, 82, 222, 0.3); }
    .return-plane { color: #AF52DE; }

    .btn-return-action {
      background: #AF52DE;
      color: white;
      font-weight: 600;
    }
    .btn-return-action:hover {
      background: #9B3EC5;
      box-shadow: 0 4px 12px rgba(175, 82, 222, 0.3);
    }

    .return-section-label {
      color: #AF52DE;
    }

    .return-smart-bar {
      background: rgba(175, 82, 222, 0.05);
      border: 1px solid rgba(175, 82, 222, 0.15);
    }

    .return-chip:hover {
      border-color: #AF52DE;
      box-shadow: 0 4px 12px rgba(175, 82, 222, 0.12);
    }

    .return-input:focus {
      border-color: rgba(175, 82, 222, 0.5);
      box-shadow: 0 0 0 3px rgba(175, 82, 222, 0.1);
    }

    .return-dropdown {
      border-color: rgba(175, 82, 222, 0.2);
    }

    .return-dropdown-header {
      border-bottom-color: rgba(175, 82, 222, 0.15);
    }

    .return-badge {
      background: rgba(175, 82, 222, 0.12);
      color: #AF52DE;
    }

    .return-banner {
      background: rgba(175, 82, 222, 0.1);
      border: 1px solid rgba(175, 82, 222, 0.3);
    }

    .return-checkmark {
      background: #AF52DE;
    }

    /* Itinerary Modal specific */
    .trip-summary-bar {
      display: flex;
      gap: 16px;
      padding: 10px 14px;
      background: var(--bg-secondary);
      border-radius: 10px;
      margin-bottom: 16px;
      font-size: 0.8125rem;
      font-weight: 500;
      flex-wrap: wrap;
    }

    .applied-flight-banner {
      background: rgba(48, 209, 88, 0.12);
      border: 1px solid rgba(48, 209, 88, 0.3);
      animation: appleDropdownIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .checkmark-icon {
      width: 18px;
      height: 18px;
      background: var(--success);
      color: white;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.6875rem;
      font-weight: 800;
    }

    .btn-xs-text {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.75rem;
    }

    .smart-flight-bar {
      background: rgba(0, 113, 227, 0.05);
      border: 1px solid rgba(0, 113, 227, 0.15);
    }

    .quick-flight-chip {
      background: #FFFFFF;
      border: 1px solid rgba(0, 0, 0, 0.08);
      min-width: 160px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .quick-flight-chip:hover {
      border-color: var(--accent);
      box-shadow: 0 4px 12px rgba(0, 113, 227, 0.12);
      transform: translateY(-1px);
    }

    .btn-xs {
      padding: 3px 8px;
      font-size: 0.75rem;
    }

    .grid-2-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .section-label {
      font-size: 0.9375rem;
      font-weight: 600;
      margin-bottom: 12px;
      margin-top: 4px;
    }

    .section-hint {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      margin-bottom: 16px;
      margin-top: -4px;
    }

    .section-divider {
      border-top: 1px solid var(--border-light);
      margin: 24px 0 20px 0;
    }

    .timeline-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .timeline-inputs .form-group {
      margin-bottom: 0;
    }

    @media (max-width: 600px) {
      .timeline-inputs, .grid-2-col {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TravelDeskDashboardComponent implements OnInit {
  view = 'approved';
  displayedTrips: TripRequest[] = [];
  approvedCount = 0;
  selectedTrip: TripRequest | null = null;
  showItineraryModal = false;
  itineraryLoading = false;
  returningId: number | null = null;
  itinerary: Partial<Itinerary> = {};
  timeline: Partial<ChecklistTimeline> = {};

  // Outbound flight suggestions state
  showFlightModal = false;
  flightSuggestions: FlightSuggestion[] = [];
  flightSuggestionsLoading = false;
  flightFilter: 'all' | 'preferred' | 'nonstop' | 'lowest' = 'all';
  appliedFlightNotice = '';

  // Return flight suggestions state
  showReturnFlightModal = false;
  returnFlightSuggestions: FlightSuggestion[] = [];
  returnFlightLoading = false;
  returnFlightFilter: 'all' | 'early' | 'lowest' = 'all';
  returnFlightDetails = '';
  appliedReturnFlightNotice = '';
  showReturnFlightDropdown = false;
  filteredReturnFlightDropdown: FlightSuggestion[] = [];

  // Dropdown autocomplete state for input fields
  showFlightDropdown = false;
  filteredFlightDropdown: FlightSuggestion[] = [];
  
  showHotelDropdown = false;
  allHotels: HotelSuggestion[] = [];
  filteredHotels: HotelSuggestion[] = [];

  showCabDropdown = false;
  allCabs: CabSuggestion[] = [];
  filteredCabs: CabSuggestion[] = [];

  showCompleteDetailsModal = false;
  showToastModal = false;
  toastTitle = '';
  toastMessage = '';

  constructor(
    public authService: AuthService,
    private tripService: TripService,
    private flightService: FlightService
  ) {}

  ngOnInit(): void {
    this.loadApproved();
  }

  loadApproved(): void {
    this.tripService.getApprovedRequests().subscribe({
      next: (t) => {
        this.displayedTrips = t;
        this.approvedCount = t.length;
      },
      error: () => this.displayedTrips = []
    });
  }

  loadActive(): void {
    this.tripService.getActiveTrips().subscribe({
      next: (t) => this.displayedTrips = t,
      error: () => this.displayedTrips = []
    });
  }

  /**
   * Open the dedicated Apple-style flight suggestions modal
   */
  openFlightSuggestionsModal(trip: TripRequest): void {
    this.selectedTrip = trip;
    this.flightSuggestionsLoading = true;
    this.showFlightModal = true;
    this.flightFilter = 'all';

    const extraLuggage = trip.extraLuggageKg || 0;
    this.flightService.getFlightSuggestions(trip.destination, 'DEL', trip.startDate, trip.endDate, extraLuggage).subscribe({
      next: (flights) => {
        this.flightSuggestions = flights;
        this.filteredFlightDropdown = flights;
        this.flightSuggestionsLoading = false;
      },
      error: () => {
        this.flightSuggestionsLoading = false;
      }
    });
  }

  getFilteredFlights(): FlightSuggestion[] {
    if (this.flightFilter === 'preferred') {
      return this.flightSuggestions.filter(f => f.tag?.includes('Corporate') || f.tag?.includes('Preferred'));
    }
    if (this.flightFilter === 'nonstop') {
      return this.flightSuggestions.filter(f => f.stops.toLowerCase().includes('non-stop'));
    }
    if (this.flightFilter === 'lowest') {
      return [...this.flightSuggestions].sort((a, b) => a.price - b.price);
    }
    return this.flightSuggestions;
  }

  /**
   * Open the Itinerary & Checklist Timeline Builder Modal
   */
  openItineraryModal(trip: TripRequest): void {
    this.selectedTrip = trip;
    this.itinerary = trip.itinerary ? { ...trip.itinerary } : {};
    this.timeline = this.buildDefaultTimeline(trip);
    this.appliedFlightNotice = '';
    this.showItineraryModal = true;

    // Load outbound flight suggestions for this trip
    const extraLuggage = trip.extraLuggageKg || 0;
    this.flightService.getFlightSuggestions(trip.destination, 'DEL', trip.startDate, trip.endDate, extraLuggage).subscribe({
      next: (flights) => {
        this.flightSuggestions = flights;
        this.filteredFlightDropdown = flights;
      }
    });

    // Load return flight suggestions
    this.flightService.getReturnFlightSuggestions(trip.destination, 'DEL', trip.endDate, extraLuggage).subscribe({
      next: (flights) => {
        this.returnFlightSuggestions = flights;
        this.filteredReturnFlightDropdown = flights;
      }
    });

    this.returnFlightDetails = trip.itinerary?.returnFlightDetails || '';
    this.appliedReturnFlightNotice = '';

    // Load hotel and cab suggestions matching destination
    this.allHotels = this.flightService.getHotelSuggestions(trip.destination);
    this.filteredHotels = this.allHotels;

    this.allCabs = this.flightService.getCabSuggestions(trip.destination);
    this.filteredCabs = this.allCabs;
  }

  closeItineraryModal(): void {
    this.showItineraryModal = false;
    this.showFlightDropdown = false;
    this.showReturnFlightDropdown = false;
    this.showHotelDropdown = false;
    this.showCabDropdown = false;
  }

  /**
   * 1-Click Apply Flight to Itinerary & Sync Timeline
   */
  applyFlightToItinerary(flight: FlightSuggestion): void {
    this.itinerary.flightDetails = flight.formattedSummary;
    
    // Auto-generate realistic corporate PNR
    if (!this.itinerary.pnr) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      this.itinerary.pnr = `${flight.airlineCode}-${randomNum}`;
    }

    // Auto-sync Checklist Timeline with flight schedules
    if (flight.boardingTime) {
      this.timeline.flightBoardingTime = flight.boardingTime;
    }
    if (flight.landingTime) {
      this.timeline.flightLandingTime = flight.landingTime;
    }
    if (flight.returnFlightTime) {
      this.timeline.returnFlightTime = flight.returnFlightTime;
    }

    this.appliedFlightNotice = `Applied ${flight.airline} ${flight.flightNumber} (${flight.departureTime} → ${flight.arrivalTime}) & synchronized timeline!`;
    
    // Close flight modal if it was open
    this.showFlightModal = false;
    this.showFlightDropdown = false;
  }

  /**
   * Open the Return Flight Suggestions Modal
   */
  openReturnFlightSuggestionsModal(trip: TripRequest): void {
    this.selectedTrip = trip;
    this.returnFlightLoading = true;
    this.showReturnFlightModal = true;
    this.returnFlightFilter = 'all';

    const extraLuggage = trip.extraLuggageKg || 0;
    this.flightService.getReturnFlightSuggestions(trip.destination, 'DEL', trip.endDate, extraLuggage).subscribe({
      next: (flights) => {
        this.returnFlightSuggestions = flights;
        this.filteredReturnFlightDropdown = flights;
        this.returnFlightLoading = false;
      },
      error: () => {
        this.returnFlightLoading = false;
      }
    });
  }

  getFilteredReturnFlights(): FlightSuggestion[] {
    if (this.returnFlightFilter === 'early') {
      return this.returnFlightSuggestions.filter(f => f.tag?.includes('Early') || f.tag?.includes('Budget'));
    }
    if (this.returnFlightFilter === 'lowest') {
      return [...this.returnFlightSuggestions].sort((a, b) => a.price - b.price);
    }
    return this.returnFlightSuggestions;
  }

  /**
   * 1-Click Apply Return Flight to Timeline
   */
  applyReturnFlightToItinerary(flight: FlightSuggestion): void {
    this.returnFlightDetails = flight.formattedSummary;
    this.itinerary.returnFlightDetails = flight.formattedSummary;
    if (!this.itinerary.returnPnr) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      this.itinerary.returnPnr = `${flight.airlineCode}-${randomNum}`;
    }

    // Sync return flight time into checklist timeline
    if (flight.boardingTime) {
      this.timeline.returnFlightTime = flight.boardingTime;
    }
    if (flight.landingTime) {
      this.timeline.journeyEndTime = flight.landingTime;
    }

    this.appliedReturnFlightNotice = `Return: ${flight.airline} ${flight.flightNumber} (${flight.departureTime} → ${flight.arrivalTime}) synced to timeline!`;

    this.showReturnFlightModal = false;
    this.showReturnFlightDropdown = false;
  }

  // Autocomplete filtering handlers
  onFlightInput(): void {
    const q = (this.itinerary.flightDetails || '').toLowerCase();
    if (!q) {
      this.filteredFlightDropdown = this.flightSuggestions;
    } else {
      this.filteredFlightDropdown = this.flightSuggestions.filter(
        f => f.airline.toLowerCase().includes(q) ||
             f.flightNumber.toLowerCase().includes(q) ||
             f.formattedSummary.toLowerCase().includes(q)
      );
    }
  }

  selectFlightFromDropdown(flight: FlightSuggestion): void {
    this.applyFlightToItinerary(flight);
    this.showFlightDropdown = false;
  }

  onReturnFlightInput(): void {
    const q = (this.returnFlightDetails || '').toLowerCase();
    if (!q) {
      this.filteredReturnFlightDropdown = this.returnFlightSuggestions;
    } else {
      this.filteredReturnFlightDropdown = this.returnFlightSuggestions.filter(
        f => f.airline.toLowerCase().includes(q) ||
             f.flightNumber.toLowerCase().includes(q) ||
             f.formattedSummary.toLowerCase().includes(q)
      );
    }
  }

  selectReturnFlightFromDropdown(flight: FlightSuggestion): void {
    this.applyReturnFlightToItinerary(flight);
    this.showReturnFlightDropdown = false;
  }

  openTripDetailsModal(trip: TripRequest): void {
    this.selectedTrip = trip;
    this.showCompleteDetailsModal = true;
    if (trip.id) {
      this.tripService.getTripById(trip.id).subscribe({
        next: (full) => this.selectedTrip = full,
        error: () => {}
      });
    }
  }

  onHotelInput(): void {
    const q = (this.itinerary.hotelName || '').toLowerCase();
    if (!q) {
      this.filteredHotels = this.allHotels;
    } else {
      this.filteredHotels = this.allHotels.filter(
        h => h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q)
      );
    }
  }

  selectHotelFromDropdown(hotel: HotelSuggestion): void {
    this.itinerary.hotelName = hotel.name;
    this.itinerary.hotelAddress = hotel.address;
    this.showHotelDropdown = false;
  }

  onCabInput(): void {
    const q = (this.itinerary.cabDriverName || '').toLowerCase();
    if (!q) {
      this.filteredCabs = this.allCabs;
    } else {
      this.filteredCabs = this.allCabs.filter(
        c => c.driverName.toLowerCase().includes(q) ||
             c.vehicleNumber.toLowerCase().includes(q) ||
             c.provider.toLowerCase().includes(q)
      );
    }
  }

  selectCabFromDropdown(cab: CabSuggestion): void {
    this.itinerary.cabDriverName = `${cab.driverName} (${cab.driverPhone})`;
    this.itinerary.cabNumber = `${cab.vehicleNumber} (${cab.vehicleModel})`;
    this.showCabDropdown = false;
  }

  /**
   * Pre-fills the checklist timeline with smart defaults based on the trip's
   * start/end dates.
   */
  private buildDefaultTimeline(trip: TripRequest): Partial<ChecklistTimeline> {
    const start = trip.startDate;
    const end = trip.endDate;

    return {
      flightBoardingTime:  `${start}T08:00`,
      flightLandingTime:   `${start}T11:00`,
      cabPickupTime:       `${start}T11:30`,
      hotelCheckinTime:    `${start}T14:00`,
      hotelCheckoutTime:   `${end}T11:00`,
      returnFlightTime:    `${end}T14:00`,
      journeyEndTime:      `${end}T17:00`,
    };
  }

  submitItinerary(): void {
    if (!this.selectedTrip?.id) return;
    this.itineraryLoading = true;
    const tripId = this.selectedTrip.id;

    this.itinerary.returnFlightDetails = this.returnFlightDetails;
    if (!this.itinerary.returnPnr && this.returnFlightDetails) {
      this.itinerary.returnPnr = this.itinerary.pnr ? `${this.itinerary.pnr}-R` : `RET-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Step 1: Create itinerary
    this.tripService.createItinerary(tripId, { ...this.itinerary, tripId } as Itinerary).subscribe({
      next: () => {
        // Step 2: Save checklist timeline
        const hasTimeline = Object.values(this.timeline).some(v => v && v !== '');
        if (hasTimeline) {
          this.tripService.saveChecklistTimeline(tripId, { ...this.timeline, tripId } as ChecklistTimeline).subscribe({
            next: () => this.activateAfterSetup(tripId),
            error: (err) => {
              this.itineraryLoading = false;
              this.showToast('Error', err.error?.message || 'Failed to save checklist timeline.');
            }
          });
        } else {
          this.activateAfterSetup(tripId);
        }
      },
      error: (err) => {
        this.itineraryLoading = false;
        this.showToast('Error', err.error?.message || 'Failed to create itinerary.');
      }
    });
  }

  private activateAfterSetup(tripId: number): void {
    this.tripService.activateTrip(tripId).subscribe({
      next: () => {
        this.itineraryLoading = false;
        this.showItineraryModal = false;
        this.showToast('Success', `Trip #${tripId} activated successfully with complete itinerary and timeline!`);
        this.loadApproved();
      },
      error: (err) => {
        this.itineraryLoading = false;
        this.showToast('Error', err.error?.message || 'Failed to activate trip.');
      }
    });
  }

  markReturned(trip: TripRequest): void {
    if (!trip.id) return;
    this.returningId = trip.id;
    this.tripService.markAssetsReturned(trip.id).subscribe({
      next: () => {
        this.returningId = null;
        if (trip.itinerary) {
          trip.itinerary.assetsReturned = true;
        }
        this.showToast('Assets Returned', `Assets for Trip #${trip.id} (${trip.destination}) marked as RETURNED successfully.`);
        this.loadActive();
      },
      error: (err) => {
        this.returningId = null;
        this.showToast('Error', err.error?.message || 'Failed to mark assets as returned.');
      }
    });
  }

  showToast(title: string, message: string): void {
    this.toastTitle = title;
    this.toastMessage = message;
    this.showToastModal = true;
  }
}
