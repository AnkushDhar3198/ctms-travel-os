import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TripService } from '../../../core/services/trip.service';
import { TripRequest, Itinerary, ChecklistTimeline } from '../../../core/models/models';

@Component({
  selector: 'app-travel-desk-dashboard',
  template: `
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">✈</div>
          <span class="sidebar-brand-text">TravelOS</span>
        </div>
        <nav class="sidebar-nav">
          <button class="sidebar-link" [class.active]="view === 'approved'" (click)="view = 'approved'; loadApproved()">
            <span class="sidebar-link-icon">✅</span> Approved Requests
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

      <main class="main-content">
        <div class="page-header animate-fade-in">
          <h2>{{ view === 'approved' ? 'Approved Requests' : 'Active Trips' }}</h2>
          <p class="text-secondary">Travel Desk Dashboard</p>
        </div>

        <div class="animate-fade-in">
          <div class="displayed-trips-grid" *ngIf="displayedTrips.length > 0">
            <div *ngFor="let trip of displayedTrips" class="card trip-card p-6 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start mb-2">
                  <h4>{{ trip.destination }}</h4>
                  <span class="badge" [ngClass]="trip.status === 'APPROVED' ? 'badge-approved' : 'badge-active'">{{ trip.status }}</span>
                </div>
                <p class="text-secondary text-sm">Employee: <strong>{{ trip.employeeName }}</strong></p>
                <p class="text-secondary text-xs mt-1">Dates: <strong>{{ trip.startDate }} → {{ trip.endDate }}</strong></p>
                <p class="text-secondary text-xs" *ngIf="trip.remarks">Remarks: {{ trip.remarks }}</p>
              </div>
              <div class="flex gap-3 mt-4 pt-3 border-t">
                <button *ngIf="trip.status === 'APPROVED'" class="btn btn-sm btn-primary flex-1" (click)="openItineraryModal(trip)">📝 Build Itinerary</button>
                <button *ngIf="trip.status === 'ACTIVE' && !trip.itinerary?.assetsReturned" class="btn btn-sm btn-secondary flex-1" (click)="markReturned(trip)" [disabled]="trip.id === returningId">
                  {{ trip.id === returningId ? 'Updating...' : '🔄 Mark Assets Returned' }}
                </button>
                <span *ngIf="trip.status === 'ACTIVE' && trip.itinerary?.assetsReturned" class="badge badge-approved p-2 text-xs w-full text-center">
                  ✓ Assets Marked Returned
                </span>
              </div>
            </div>
          </div>
          <div *ngIf="displayedTrips.length === 0" class="card p-8 text-center">
            <p class="text-secondary">No requests to display.</p>
          </div>
        </div>
      </main>
    </div>

    <!-- Itinerary Modal (with Timeline Section) -->
    <div class="modal-overlay" [class.active]="showItineraryModal" (click)="showItineraryModal = false">
      <div class="modal-container itinerary-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Build Itinerary & Timeline</h3>
          <button class="modal-close" (click)="showItineraryModal = false">✕</button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
          <!-- Trip Info Summary -->
          <div class="trip-summary-bar" *ngIf="selectedTrip">
            <span>🧑‍💼 {{ selectedTrip.employeeName }}</span>
            <span>📍 {{ selectedTrip.destination }}</span>
            <span>📅 {{ selectedTrip.startDate }} → {{ selectedTrip.endDate }}</span>
          </div>

          <!-- Itinerary Section -->
          <div class="section-label">✈️ Booking Details</div>
          <div class="form-group"><label class="form-label">PNR / Ticket No</label><input class="form-input" [(ngModel)]="itinerary.pnr" placeholder="ABC123" /></div>
          <div class="form-group"><label class="form-label">Flight Details</label><input class="form-input" [(ngModel)]="itinerary.flightDetails" placeholder="AI-302, DEL→BLR, 14:30" /></div>
          <div class="form-group"><label class="form-label">Cab Driver Name</label><input class="form-input" [(ngModel)]="itinerary.cabDriverName" /></div>
          <div class="form-group"><label class="form-label">Cab Number</label><input class="form-input" [(ngModel)]="itinerary.cabNumber" /></div>
          <div class="form-group"><label class="form-label">Hotel Name</label><input class="form-input" [(ngModel)]="itinerary.hotelName" /></div>
          <div class="form-group"><label class="form-label">Hotel Address</label><input class="form-input" [(ngModel)]="itinerary.hotelAddress" /></div>
          <div class="form-group"><label class="form-label">Allocated Assets</label><input class="form-input" [(ngModel)]="itinerary.allocatedAssets" placeholder="Laptop, WiFi Dongle" /></div>

          <!-- Timeline Section -->
          <div class="section-divider"></div>
          <div class="section-label">🕐 Checklist Timeline</div>
          <p class="section-hint">Set expected date & time for each milestone based on the employee's travel plan.</p>

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
          <button class="btn btn-secondary" (click)="showItineraryModal = false">Cancel</button>
          <button class="btn btn-primary" (click)="submitItinerary()" [disabled]="itineraryLoading">
            {{ itineraryLoading ? 'Saving...' : 'Save & Activate Trip' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Notification Toast Popup -->
    <div class="modal-overlay" [class.active]="showToastModal" (click)="showToastModal = false">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">{{ toastTitle }}</h3>
          <button class="modal-close" (click)="showToastModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>{{ toastMessage }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" (click)="showToastModal = false">OK</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout { display: flex; min-height: 100vh; background: var(--bg-primary); }
    .page-header { margin-bottom: 32px; }
    .page-header h2 { font-size: 1.75rem; }
    .displayed-trips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
      width: 100%;
    }

    .itinerary-modal {
      max-width: 620px;
    }

    .trip-summary-bar {
      display: flex;
      gap: 16px;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 0.8125rem;
      font-weight: 500;
      flex-wrap: wrap;
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
      .timeline-inputs {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TravelDeskDashboardComponent implements OnInit {
  view = 'approved';
  displayedTrips: TripRequest[] = [];
  selectedTrip: TripRequest | null = null;
  showItineraryModal = false;
  itineraryLoading = false;
  returningId: number | null = null;
  itinerary: Partial<Itinerary> = {};
  timeline: Partial<ChecklistTimeline> = {};

  showToastModal = false;
  toastTitle = '';
  toastMessage = '';

  constructor(public authService: AuthService, private tripService: TripService) {}

  ngOnInit(): void { this.loadApproved(); }

  loadApproved(): void {
    this.tripService.getApprovedRequests().subscribe({
      next: (t) => this.displayedTrips = t, error: () => this.displayedTrips = []
    });
  }

  loadActive(): void {
    this.tripService.getActiveTrips().subscribe({
      next: (t) => this.displayedTrips = t, error: () => this.displayedTrips = []
    });
  }

  openItineraryModal(trip: TripRequest): void {
    this.selectedTrip = trip;
    this.itinerary = {};
    this.timeline = this.buildDefaultTimeline(trip);
    this.showItineraryModal = true;
  }

  /**
   * Pre-fills the checklist timeline with smart defaults based on the trip's
   * start/end dates and travel requirements. Travel Desk can edit all values.
   */
  private buildDefaultTimeline(trip: TripRequest): Partial<ChecklistTimeline> {
    const start = trip.startDate; // "YYYY-MM-DD"
    const end = trip.endDate;     // "YYYY-MM-DD"

    // datetime-local format: "YYYY-MM-DDTHH:mm"
    return {
      flightBoardingTime:  `${start}T08:00`,   // Day 1, 8:00 AM departure
      flightLandingTime:   `${start}T11:00`,   // Day 1, 11:00 AM arrival (~3h flight)
      cabPickupTime:       `${start}T11:30`,   // Day 1, 11:30 AM cab from airport
      hotelCheckinTime:    `${start}T14:00`,   // Day 1, 2:00 PM hotel check-in
      hotelCheckoutTime:   `${end}T11:00`,     // Last day, 11:00 AM checkout
      returnFlightTime:    `${end}T14:00`,     // Last day, 2:00 PM return flight
      journeyEndTime:      `${end}T17:00`,     // Last day, 5:00 PM arrive home
    };
  }

  submitItinerary(): void {
    if (!this.selectedTrip?.id) return;
    this.itineraryLoading = true;
    const tripId = this.selectedTrip.id;

    // Step 1: Create itinerary
    this.tripService.createItinerary(tripId, { ...this.itinerary, tripId } as Itinerary).subscribe({
      next: () => {
        // Step 2: Save checklist timeline (if any times were set)
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
