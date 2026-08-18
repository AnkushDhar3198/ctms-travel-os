import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TripService } from '../../../core/services/trip.service';
import { TripRequest, ApprovalRequest } from '../../../core/models/models';

@Component({
  selector: 'app-manager-dashboard',
  template: `
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">✈</div>
          <span class="sidebar-brand-text">TravelOS</span>
        </div>
        <nav class="sidebar-nav">
          <button class="sidebar-link" [class.active]="view === 'pending'" (click)="view = 'pending'; loadPending()">
            <span class="sidebar-link-icon">📋</span> Pending Requests
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
          <h2>{{ view === 'pending' ? 'Pending Approvals' : 'Active Trips' }}</h2>
          <p class="text-secondary">Manager Dashboard</p>
        </div>

        <div class="animate-fade-in">
          <div class="displayed-trips-grid" *ngIf="displayedTrips.length > 0">
            <div *ngFor="let trip of displayedTrips" class="card trip-card p-6 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start mb-2">
                  <h4>{{ trip.destination }}</h4>
                  <span class="badge" [ngClass]="trip.status === 'PENDING_MANAGER' ? 'badge-pending' : 'badge-active'">
                    {{ trip.status }}
                  </span>
                </div>
                <p class="text-secondary text-sm">
                  <strong>{{ trip.employeeName }}</strong> ({{ trip.employeeEmpId }})
                </p>
                <p class="text-secondary text-xs mt-1">
                  Project: <strong>{{ trip.projectNo }}</strong> · Cost: <strong>₹{{ trip.estimatedCost }}</strong>
                </p>
                <p class="text-secondary text-xs">{{ trip.startDate }} → {{ trip.endDate }}</p>
              </div>
              <div class="flex gap-3 mt-4 pt-3 border-t" *ngIf="trip.status === 'PENDING_MANAGER'">
                <button class="btn btn-sm btn-success flex-1" (click)="openApproveModal(trip)">✓ Approve</button>
                <button class="btn btn-sm btn-danger flex-1" (click)="openRejectModal(trip)">✕ Reject</button>
              </div>
            </div>
          </div>
          <div *ngIf="displayedTrips.length === 0" class="empty-state card p-8 text-center">
            <p class="text-secondary">No requests to display.</p>
          </div>
        </div>
      </main>
    </div>

    <!-- Approve Modal -->
    <div class="modal-overlay" [class.active]="showApproveModal" (click)="showApproveModal = false">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Approve Request</h3>
          <button class="modal-close" (click)="showApproveModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="text-secondary mb-4">Approving trip for <strong>{{ selectedTrip?.employeeName }}</strong> to <strong>{{ selectedTrip?.destination }}</strong></p>
          <div class="form-group">
            <label class="form-label">Remarks</label>
            <textarea class="form-input" placeholder="Add any remarks..." [(ngModel)]="approvalRemarks"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Allocated Assets</label>
            <input class="form-input" placeholder="e.g. Laptop, Mobile Hotspot" [(ngModel)]="allocatedAssets" />
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
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Reject Request</h3>
          <button class="modal-close" (click)="showRejectModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Reason for Rejection</label>
            <textarea class="form-input" placeholder="Please provide a reason..." [(ngModel)]="rejectReason"></textarea>
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
    .trip-card { transition: var(--transition-normal); }
    .trip-card:hover { box-shadow: var(--shadow-lg); }
    .empty-state { margin-top: 48px; }
  `]
})
export class ManagerDashboardComponent implements OnInit {
  view = 'pending';
  displayedTrips: TripRequest[] = [];
  selectedTrip: TripRequest | null = null;

  showApproveModal = false;
  showRejectModal = false;
  approvalRemarks = '';
  allocatedAssets = '';
  rejectReason = '';
  approveLoading = false;
  rejectLoading = false;

  constructor(
    public authService: AuthService,
    private tripService: TripService
  ) {}

  ngOnInit(): void {
    this.loadPending();
  }

  loadPending(): void {
    this.tripService.getPendingRequests().subscribe({
      next: (t) => this.displayedTrips = t,
      error: () => this.displayedTrips = []
    });
  }

  loadActive(): void {
    this.tripService.getActiveTrips().subscribe({
      next: (t) => this.displayedTrips = t,
      error: () => this.displayedTrips = []
    });
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
      },
      error: () => { this.rejectLoading = false; }
    });
  }
}
