import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TripService } from '../../../core/services/trip.service';
import { TripRequest, Itinerary } from '../../../core/models/models';

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
                <button *ngIf="trip.status === 'ACTIVE'" class="btn btn-sm btn-secondary flex-1" (click)="markReturned(trip)">🔄 Mark Assets Returned</button>
              </div>
            </div>
          </div>
          <div *ngIf="displayedTrips.length === 0" class="card p-8 text-center">
            <p class="text-secondary">No requests to display.</p>
          </div>
        </div>
      </main>
    </div>

    <!-- Itinerary Modal -->
    <div class="modal-overlay" [class.active]="showItineraryModal" (click)="showItineraryModal = false">
      <div class="modal-container" style="max-width:560px" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Build Itinerary</h3>
          <button class="modal-close" (click)="showItineraryModal = false">✕</button>
        </div>
        <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
          <div class="form-group"><label class="form-label">PNR / Ticket No</label><input class="form-input" [(ngModel)]="itinerary.pnr" placeholder="ABC123" /></div>
          <div class="form-group"><label class="form-label">Flight Details</label><input class="form-input" [(ngModel)]="itinerary.flightDetails" placeholder="AI-302, DEL→BLR, 14:30" /></div>
          <div class="form-group"><label class="form-label">Cab Driver Name</label><input class="form-input" [(ngModel)]="itinerary.cabDriverName" /></div>
          <div class="form-group"><label class="form-label">Cab Number</label><input class="form-input" [(ngModel)]="itinerary.cabNumber" /></div>
          <div class="form-group"><label class="form-label">Hotel Name</label><input class="form-input" [(ngModel)]="itinerary.hotelName" /></div>
          <div class="form-group"><label class="form-label">Hotel Address</label><input class="form-input" [(ngModel)]="itinerary.hotelAddress" /></div>
          <div class="form-group"><label class="form-label">Allocated Assets</label><input class="form-input" [(ngModel)]="itinerary.allocatedAssets" placeholder="Laptop, WiFi Dongle" /></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showItineraryModal = false">Cancel</button>
          <button class="btn btn-primary" (click)="submitItinerary()" [disabled]="itineraryLoading">
            {{ itineraryLoading ? 'Saving...' : 'Save & Activate Trip' }}
          </button>
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
  `]
})
export class TravelDeskDashboardComponent implements OnInit {
  view = 'approved';
  displayedTrips: TripRequest[] = [];
  selectedTrip: TripRequest | null = null;
  showItineraryModal = false;
  itineraryLoading = false;
  itinerary: Partial<Itinerary> = {};

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
    this.showItineraryModal = true;
  }

  submitItinerary(): void {
    if (!this.selectedTrip?.id) return;
    this.itineraryLoading = true;
    const tripId = this.selectedTrip.id;

    this.tripService.createItinerary(tripId, { ...this.itinerary, tripId } as Itinerary).subscribe({
      next: () => {
        this.tripService.activateTrip(tripId).subscribe({
          next: () => {
            this.itineraryLoading = false;
            this.showItineraryModal = false;
            this.loadApproved();
          },
          error: () => { this.itineraryLoading = false; }
        });
      },
      error: () => { this.itineraryLoading = false; }
    });
  }

  markReturned(trip: TripRequest): void {
    if (!trip.id) return;
    this.tripService.markAssetsReturned(trip.id).subscribe({
      next: () => this.loadActive()
    });
  }
}
