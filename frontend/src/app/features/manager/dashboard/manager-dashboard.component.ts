import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TripService } from '../../../core/services/trip.service';
import { TripRequest, ApprovalRequest } from '../../../core/models/models';

@Component({
  selector: 'app-manager-dashboard',
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">✈</div>
          <span class="sidebar-brand-text">TravelOS</span>
        </div>
        <nav class="sidebar-nav">
          <button class="sidebar-link" [class.active]="view === 'pending'" (click)="view = 'pending'; loadPending()">
            <span class="sidebar-link-icon">📋</span> Pending Requests
            <span class="sidebar-badge" *ngIf="pendingCount > 0">{{ pendingCount }}</span>
          </button>
          <button class="sidebar-link" [class.active]="view === 'active'" (click)="view = 'active'; loadActive()">
            <span class="sidebar-link-icon">🔄</span> Active Trips
            <span class="sidebar-badge badge-active-count" *ngIf="activeCount > 0">{{ activeCount }}</span>
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
        <div class="page-header flex justify-between items-center animate-fade-in">
          <div>
            <h2>{{ view === 'pending' ? 'Pending Approvals' : 'Active Employee Trips' }}</h2>
            <p class="text-secondary">
              {{ view === 'pending' ? 'Review & authorize employee travel requests' : 'Live monitoring of underway trips & logistics' }}
            </p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-sm btn-apple-ghost" (click)="refreshCurrentView()" [disabled]="refreshLoading">
              <span class="spinner" *ngIf="refreshLoading"></span>
              {{ refreshLoading ? 'Refreshing...' : '🔄 Refresh' }}
            </button>
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
                  <span class="badge" [ngClass]="trip.status === 'PENDING_MANAGER' ? 'badge-pending' : 'badge-active'">
                    {{ trip.status }}
                  </span>
                </div>

                <div class="trip-meta-box p-3 rounded-md mb-3 mt-2 bg-primary">
                  <p class="text-secondary text-xs">Employee: <strong>{{ trip.employeeName }}</strong> ({{ trip.employeeEmpId }})</p>
                  <p class="text-secondary text-xs mt-1">Dates: <strong>{{ trip.startDate }} → {{ trip.endDate }}</strong></p>
                  <p class="text-secondary text-xs mt-1">Budget: <strong>₹{{ trip.estimatedCost | number }}</strong> · Client: <strong>{{ trip.clientId }}</strong></p>
                  <p class="text-secondary text-xs mt-1" *ngIf="trip.remarks">Remarks: <em>{{ trip.remarks }}</em></p>
                </div>

                <!-- Active Trip Itinerary & Milestone Highlights -->
                <div *ngIf="trip.status === 'ACTIVE'" class="itinerary-summary-box p-3 rounded-lg mb-3">
                  <div class="text-xs font-bold text-accent mb-2 flex items-center gap-1">
                    <span>✈️</span> Confirmed Itinerary Details
                  </div>
                  
                  <div class="text-xs text-secondary mb-1 flex justify-between" *ngIf="trip.itinerary?.flightDetails">
                    <span>Flight: <strong>{{ trip.itinerary?.flightDetails }}</strong></span>
                    <span class="badge badge-active text-2xs" *ngIf="trip.itinerary?.pnr">PNR: {{ trip.itinerary?.pnr }}</span>
                  </div>
                  
                  <div class="text-xs text-secondary mb-1" *ngIf="trip.itinerary?.hotelName">
                    🏨 Hotel: <strong>{{ trip.itinerary?.hotelName }}</strong>
                  </div>

                  <div class="text-xs text-secondary mb-1" *ngIf="trip.itinerary?.cabDriverName">
                    🚕 Cab: <strong>{{ trip.itinerary?.cabDriverName }}</strong> ({{ trip.itinerary?.cabNumber }})
                  </div>

                  <div class="text-xs text-secondary" *ngIf="trip.itinerary?.allocatedAssets">
                    💼 Assets: <strong>{{ trip.itinerary?.allocatedAssets }}</strong>
                  </div>

                  <!-- Milestone Status Flow -->
                  <div class="milestone-mini-flow flex gap-1 mt-2 pt-2 border-t flex-wrap">
                    <span class="milestone-chip" [class.done]="trip.milestones?.flightBoarded">✈️ Boarded</span>
                    <span class="milestone-chip" [class.done]="trip.milestones?.flightLanded">🛬 Landed</span>
                    <span class="milestone-chip" [class.done]="trip.milestones?.cabPickedUp">🚕 Cab</span>
                    <span class="milestone-chip" [class.done]="trip.milestones?.hotelCheckedIn">🏨 Hotel</span>
                    <span class="milestone-chip" [class.done]="trip.milestones?.returnFlightBoarded">🛫 Return</span>
                    <span class="milestone-chip" [class.done]="trip.milestones?.journeyEnded">🏠 Ended</span>
                  </div>
                </div>

                <!-- Logistics Badges for Pending -->
                <div class="flex gap-2 text-xs mb-3" *ngIf="trip.status === 'PENDING_MANAGER'">
                  <span class="tag" *ngIf="trip.needsFlight">✈️ Flight</span>
                  <span class="tag" *ngIf="trip.needsHotel">🏨 Hotel</span>
                  <span class="tag" *ngIf="trip.needsCab">🚖 Cab</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 mt-2 pt-3 border-t flex-wrap">
                <button *ngIf="trip.status === 'PENDING_MANAGER'" class="btn btn-sm btn-success flex-1" (click)="openApproveModal(trip)">
                  ✓ Approve Request
                </button>
                <button *ngIf="trip.status === 'PENDING_MANAGER'" class="btn btn-sm btn-danger flex-1" (click)="openRejectModal(trip)">
                  ✕ Reject
                </button>
                <button *ngIf="trip.status === 'ACTIVE'" class="btn btn-sm btn-secondary flex-1" (click)="openDetailsModal(trip)">
                  🔍 View Itinerary & Milestones
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="displayedTrips.length === 0" class="card p-12 text-center">
            <div class="text-4xl mb-2">{{ view === 'pending' ? '📋' : '🔄' }}</div>
            <p class="text-secondary">
              {{ view === 'pending' ? 'No pending requests to approve.' : 'No active trips currently in progress.' }}
            </p>
          </div>
        </div>
      </main>
    </div>

    <!-- Approve Modal -->
    <div class="modal-overlay" [class.active]="showApproveModal" (click)="showApproveModal = false">
      <div class="modal-container modal-container-md" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Approve Travel Request</h3>
          <button class="modal-close" (click)="showApproveModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="text-secondary text-sm mb-4">
            Approving trip for <strong>{{ selectedTrip?.employeeName }}</strong> to <strong>{{ selectedTrip?.destination }}</strong>
          </p>
          <div class="form-group">
            <label class="form-label">Approval Remarks</label>
            <textarea class="form-input" placeholder="Add approval remarks or instructions..." [(ngModel)]="approvalRemarks"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Allocated Equipment / Assets</label>
            <input class="form-input" placeholder="e.g. Laptop, Mobile Hotspot, Forex Card" [(ngModel)]="allocatedAssets" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showApproveModal = false">Cancel</button>
          <button class="btn btn-success" (click)="confirmApprove()" [disabled]="approveLoading">
            <span class="spinner" *ngIf="approveLoading"></span>
            {{ approveLoading ? 'Approving...' : 'Confirm Approval' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div class="modal-overlay" [class.active]="showRejectModal" (click)="showRejectModal = false">
      <div class="modal-container modal-container-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Reject Request</h3>
          <button class="modal-close" (click)="showRejectModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Reason for Rejection *</label>
            <textarea class="form-input" placeholder="Please provide a clear reason..." [(ngModel)]="rejectReason"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showRejectModal = false">Cancel</button>
          <button class="btn btn-danger" (click)="confirmReject()" [disabled]="rejectLoading">
            {{ rejectLoading ? 'Rejecting...' : 'Confirm Rejection' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Manager Detailed Itinerary Modal -->
    <div class="modal-overlay" [class.active]="showDetailsModal" (click)="showDetailsModal = false">
      <div class="modal-container modal-container-md" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Trip #{{ selectedTrip?.id }} — {{ selectedTrip?.destination }}</h3>
            <p class="text-xs text-secondary mt-1">Employee: <strong>{{ selectedTrip?.employeeName }}</strong> ({{ selectedTrip?.employeeEmpId }})</p>
          </div>
          <button class="modal-close" (click)="showDetailsModal = false">✕</button>
        </div>
        
        <div class="modal-body" *ngIf="selectedTrip" style="max-height: 70vh; overflow-y: auto;">
          <!-- Flight Details -->
          <div class="detail-section p-4 rounded-xl mb-3 bg-primary">
            <h4 class="text-sm font-bold text-accent mb-2">✈️ Flight Booking & PNR</h4>
            <div class="text-xs text-secondary leading-relaxed">
              <p><strong>Details:</strong> {{ selectedTrip.itinerary?.flightDetails || 'Pending Booking' }}</p>
              <p *ngIf="selectedTrip.itinerary?.pnr" class="mt-1"><strong>PNR / Ticket:</strong> <span class="badge badge-active">{{ selectedTrip.itinerary?.pnr }}</span></p>
            </div>
          </div>

          <!-- Hotel Details -->
          <div class="detail-section p-4 rounded-xl mb-3 bg-primary">
            <h4 class="text-sm font-bold text-accent mb-2">🏨 Hotel Stay</h4>
            <div class="text-xs text-secondary leading-relaxed">
              <p><strong>Hotel:</strong> {{ selectedTrip.itinerary?.hotelName || 'Pending Allocation' }}</p>
              <p *ngIf="selectedTrip.itinerary?.hotelAddress" class="mt-1"><strong>Address:</strong> {{ selectedTrip.itinerary?.hotelAddress }}</p>
            </div>
          </div>

          <!-- Cab Transfer -->
          <div class="detail-section p-4 rounded-xl mb-3 bg-primary">
            <h4 class="text-sm font-bold text-accent mb-2">🚕 Cab Transfer</h4>
            <div class="text-xs text-secondary leading-relaxed">
              <p><strong>Driver:</strong> {{ selectedTrip.itinerary?.cabDriverName || 'Pending Allocation' }}</p>
              <p *ngIf="selectedTrip.itinerary?.cabNumber" class="mt-1"><strong>Vehicle:</strong> {{ selectedTrip.itinerary?.cabNumber }}</p>
            </div>
          </div>

          <!-- Equipment & Assets -->
          <div class="detail-section p-4 rounded-xl mb-3 bg-primary">
            <h4 class="text-sm font-bold text-accent mb-2">💼 Allocated Assets</h4>
            <div class="text-xs text-secondary">
              <p><strong>Assets:</strong> {{ selectedTrip.itinerary?.allocatedAssets || 'None' }}</p>
              <p class="mt-1"><strong>Return Status:</strong> {{ selectedTrip.itinerary?.assetsReturned ? '✓ Returned' : 'In Possession of Employee' }}</p>
            </div>
          </div>

          <!-- Milestone Progress -->
          <div class="detail-section p-4 rounded-xl bg-primary" *ngIf="selectedTrip.milestones">
            <h4 class="text-sm font-bold text-accent mb-2">📍 Journey Milestones</h4>
            <div class="milestones-checklist text-xs">
              <div class="flex justify-between py-1 border-b">
                <span>✈️ Outbound Flight Boarded</span>
                <strong>{{ selectedTrip.milestones?.flightBoarded ? '✓ Completed (' + selectedTrip.milestones?.flightBoardedVerification + ')' : '⏳ Pending' }}</strong>
              </div>
              <div class="flex justify-between py-1 border-b">
                <span>🛬 Destination Flight Landed</span>
                <strong>{{ selectedTrip.milestones?.flightLanded ? '✓ Completed (' + selectedTrip.milestones?.flightLandedVerification + ')' : '⏳ Pending' }}</strong>
              </div>
              <div class="flex justify-between py-1 border-b">
                <span>🚕 Cab Pickup</span>
                <strong>{{ selectedTrip.milestones?.cabPickedUp ? '✓ Completed' : '⏳ Pending' }}</strong>
              </div>
              <div class="flex justify-between py-1 border-b">
                <span>🏨 Hotel Check-In</span>
                <strong>{{ selectedTrip.milestones?.hotelCheckedIn ? '✓ Completed' : '⏳ Pending' }}</strong>
              </div>
              <div class="flex justify-between py-1 border-b">
                <span>🧳 Hotel Check-Out</span>
                <strong>{{ selectedTrip.milestones?.hotelCheckedOut ? '✓ Completed' : '⏳ Pending' }}</strong>
              </div>
              <div class="flex justify-between py-1 border-b">
                <span>🛫 Return Flight</span>
                <strong>{{ selectedTrip.milestones?.returnFlightBoarded ? '✓ Completed' : '⏳ Pending' }}</strong>
              </div>
              <div class="flex justify-between py-1">
                <span>🏠 Journey Ended</span>
                <strong>{{ selectedTrip.milestones?.journeyEnded ? '✓ Completed' : '⏳ Pending' }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" (click)="showDetailsModal = false">Close</button>
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
      background: var(--warning);
      color: white;
      font-size: 0.6875rem;
      padding: 1px 7px;
      border-radius: 9999px;
      font-weight: 700;
    }
    .badge-active-count {
      background: var(--accent);
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

    .itinerary-summary-box {
      background: rgba(0, 113, 227, 0.05);
      border: 1px solid rgba(0, 113, 227, 0.15);
    }

    .tag {
      background: rgba(0, 113, 227, 0.08);
      color: var(--accent);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .text-2xs {
      font-size: 0.625rem;
    }

    .milestone-chip {
      font-size: 0.6875rem;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.05);
      color: var(--text-tertiary);
    }
    .milestone-chip.done {
      background: rgba(48, 209, 88, 0.12);
      color: #1A9E38;
      font-weight: 600;
    }

    .detail-section {
      border: 1px solid var(--border-light);
    }
  `]
})
export class ManagerDashboardComponent implements OnInit {
  view = 'pending';
  displayedTrips: TripRequest[] = [];
  selectedTrip: TripRequest | null = null;
  pendingCount = 0;
  activeCount = 0;

  showApproveModal = false;
  showRejectModal = false;
  showDetailsModal = false;
  approvalRemarks = '';
  allocatedAssets = '';
  rejectReason = '';
  approveLoading = false;
  rejectLoading = false;
  refreshLoading = false;

  constructor(
    public authService: AuthService,
    private tripService: TripService
  ) {}

  ngOnInit(): void {
    this.loadPending();
    this.fetchCounts();
  }

  fetchCounts(): void {
    this.tripService.getPendingRequests().subscribe({
      next: (t) => this.pendingCount = t.length,
      error: () => {}
    });
    this.tripService.getActiveTrips().subscribe({
      next: (t) => this.activeCount = t.length,
      error: () => {}
    });
  }

  loadPending(): void {
    this.tripService.getPendingRequests().subscribe({
      next: (t) => {
        this.displayedTrips = t;
        this.pendingCount = t.length;
      },
      error: () => this.displayedTrips = []
    });
  }

  loadActive(): void {
    this.tripService.getActiveTrips().subscribe({
      next: (t) => {
        this.displayedTrips = t;
        this.activeCount = t.length;
      },
      error: () => this.displayedTrips = []
    });
  }

  refreshCurrentView(): void {
    this.refreshLoading = true;
    this.fetchCounts();
    if (this.view === 'pending') {
      this.tripService.getPendingRequests().subscribe({
        next: (t) => {
          this.displayedTrips = t;
          this.pendingCount = t.length;
          this.refreshLoading = false;
        },
        error: () => { this.refreshLoading = false; }
      });
    } else {
      this.tripService.getActiveTrips().subscribe({
        next: (t) => {
          this.displayedTrips = t;
          this.activeCount = t.length;
          this.refreshLoading = false;
        },
        error: () => { this.refreshLoading = false; }
      });
    }
  }

  openApproveModal(trip: TripRequest): void {
    this.selectedTrip = trip;
    this.approvalRemarks = '';
    this.allocatedAssets = '';
    this.showApproveModal = true;
  }

  openRejectModal(trip: TripRequest): void {
    this.selectedTrip = trip;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  openDetailsModal(trip: TripRequest): void {
    this.selectedTrip = trip;
    this.showDetailsModal = true;
  }

  confirmApprove(): void {
    if (!this.selectedTrip?.id) return;
    this.approveLoading = true;

    this.tripService.approveTrip(this.selectedTrip.id, {
      remarks: this.approvalRemarks,
      allocatedAssets: this.allocatedAssets
    }).subscribe({
      next: () => {
        this.approveLoading = false;
        this.showApproveModal = false;
        this.loadPending();
        this.fetchCounts();
      },
      error: () => { this.approveLoading = false; }
    });
  }

  confirmReject(): void {
    if (!this.selectedTrip?.id) return;
    this.rejectLoading = true;

    this.tripService.rejectTrip(this.selectedTrip.id, this.rejectReason).subscribe({
      next: () => {
        this.rejectLoading = false;
        this.showRejectModal = false;
        this.loadPending();
        this.fetchCounts();
      },
      error: () => { this.rejectLoading = false; }
    });
  }
}
