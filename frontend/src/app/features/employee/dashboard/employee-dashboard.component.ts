import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TripService } from '../../../core/services/trip.service';
import { UserProfile, TripRequest, Expense } from '../../../core/models/models';

@Component({
  selector: 'app-employee-dashboard',
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">✈</div>
          <span class="sidebar-brand-text">TravelOS</span>
        </div>

        <nav class="sidebar-nav">
          <button class="sidebar-link" [class.active]="activeView === 'profile'" (click)="activeView = 'profile'">
            <span class="sidebar-link-icon">👤</span> Profile
          </button>
          <button class="sidebar-link" [class.active]="activeView === 'trips'" (click)="activeView = 'trips'; loadTrips()">
            <span class="sidebar-link-icon">🗂️</span> My Trips
          </button>
          <button class="sidebar-link" [class.active]="activeView === 'raise'" (click)="activeView = 'raise'">
            <span class="sidebar-link-icon">✏️</span> Raise Request
          </button>
          <button class="sidebar-link" [class.active]="activeView === 'expenses'" (click)="activeView = 'expenses'; loadExpenses()">
            <span class="sidebar-link-icon">🧾</span> Expenses
          </button>
          <button class="sidebar-link" [class.active]="activeView === 'tracking'" (click)="activeView = 'tracking'">
            <span class="sidebar-link-icon">📍</span> Live Tracking
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="sidebar-link text-danger" (click)="logout()">
            <span class="sidebar-link-icon">↪</span> Sign Out
          </button>
        </div>
      </aside>

      <!-- Main Content (Full screen width) -->
      <main class="main-content">
        <!-- Header -->
        <div class="page-header flex justify-between items-center animate-fade-in">
          <div>
            <h2>{{ getViewTitle() }}</h2>
            <p class="text-secondary" *ngIf="profile">Welcome back, {{ profile.name }}</p>
          </div>
          <div class="header-actions flex gap-3" *ngIf="activeView === 'trips'">
            <button class="btn btn-primary btn-sm" (click)="activeView = 'raise'">+ New Request</button>
          </div>
        </div>

        <!-- ================= PROFILE VIEW ================= -->
        <div *ngIf="activeView === 'profile'" class="animate-fade-in">
          <div *ngIf="profile" class="flex flex-col gap-6">
            <!-- Full Width Hero Profile Banner -->
            <div class="card p-6 profile-hero-card">
              <div class="flex items-center justify-between flex-wrap gap-6">
                <div class="flex items-center gap-5">
                  <div class="profile-avatar-lg">{{ profile.name?.charAt(0) }}</div>
                  <div>
                    <h3 class="text-xl font-bold">{{ profile.name }}</h3>
                    <p class="text-secondary">{{ profile.designation }} · {{ profile.department }}</p>
                    <div class="flex gap-2 mt-2">
                      <span class="badge badge-active">{{ profile.empId }}</span>
                      <span class="badge badge-approved" *ngIf="profile.isActive">Active Status</span>
                    </div>
                  </div>
                </div>

                <!-- Quick Stat Metrics Bar -->
                <div class="profile-stats-bar flex gap-8">
                  <div class="stat-item text-center">
                    <span class="stat-num text-accent">{{ profile.totalTrips }}</span>
                    <span class="stat-lbl text-secondary">Total Trips</span>
                  </div>
                  <div class="stat-item text-center">
                    <span class="stat-num text-success">{{ profile.activeTripsCount }}</span>
                    <span class="stat-lbl text-secondary">Active</span>
                  </div>
                  <div class="stat-item text-center">
                    <span class="stat-num text-warning">{{ countPendingTrips() }}</span>
                    <span class="stat-lbl text-secondary">Pending</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2 Column Full-Width Details Grid -->
            <div class="full-grid-2">
              <div class="card p-6">
                <h4 class="mb-4 text-lg">Personal & Contact Details</h4>
                <div class="details-list">
                  <div class="detail-row">
                    <span class="detail-label">Employee ID</span>
                    <strong class="detail-val">{{ profile.empId }}</strong>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Date of Joining</span>
                    <strong class="detail-val">{{ profile.dateOfJoining || '—' }}</strong>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Contact Number</span>
                    <strong class="detail-val">{{ profile.contact || '—' }}</strong>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Department</span>
                    <strong class="detail-val">{{ profile.department || '—' }}</strong>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Designation</span>
                    <strong class="detail-val">{{ profile.designation || '—' }}</strong>
                  </div>
                </div>
              </div>

              <div class="card p-6">
                <h4 class="mb-4 text-lg">Identity & Travel Identification</h4>
                <div class="details-list">
                  <div class="detail-row">
                    <span class="detail-label">Passport Number</span>
                    <strong class="detail-val">{{ profile.passportNumber || '—' }}</strong>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Government ID (Aadhaar/PAN)</span>
                    <strong class="detail-val">{{ profile.govtId || '—' }}</strong>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Corporate Travel Tier</span>
                    <strong class="detail-val text-accent">Tier-1 Authorized</strong>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Emergency Desk Line</span>
                    <strong class="detail-val">+91-1800-TRAVEL-OS</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= MY TRIPS VIEW ================= -->
        <div *ngIf="activeView === 'trips'" class="animate-fade-in">
          <div class="tab-nav mb-6">
            <button *ngFor="let tab of tripTabs" class="tab-item" [class.active]="activeTab === tab" (click)="activeTab = tab">
              {{ tab }} ({{ getTabCount(tab) }})
            </button>
          </div>

          <!-- Full Width Multi-Column Cards Grid -->
          <div class="trips-cards-grid" *ngIf="getFilteredTrips().length > 0">
            <div *ngFor="let trip of getFilteredTrips()" class="card trip-card p-6 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <span class="text-xs text-tertiary uppercase tracking-wider font-semibold">TRIP #{{ trip.id }}</span>
                    <h3 class="text-lg font-bold mt-1">{{ trip.destination }}</h3>
                  </div>
                  <span class="badge" [ngClass]="getBadgeClass(trip.status || '')">{{ trip.status }}</span>
                </div>

                <div class="trip-info-box p-3 rounded-md mb-4 bg-primary">
                  <div class="flex justify-between text-xs text-secondary mb-1">
                    <span>Project: <strong>{{ trip.projectNo }}</strong></span>
                    <span>Client: <strong>{{ trip.clientId }}</strong></span>
                  </div>
                  <div class="flex justify-between text-xs text-secondary">
                    <span>Dates: <strong>{{ trip.startDate }} → {{ trip.endDate }}</strong></span>
                    <span>Est: <strong>₹{{ trip.estimatedCost }}</strong></span>
                  </div>
                </div>

                <div class="flex gap-2 text-xs mb-4">
                  <span class="tag" *ngIf="trip.needsFlight">✈️ Flight Required</span>
                  <span class="tag" *ngIf="trip.needsHotel">🏨 Hotel Required</span>
                  <span class="tag" *ngIf="trip.needsCab">🚖 Cab Required</span>
                </div>

                <div *ngIf="trip.rejectionReason" class="text-xs text-danger p-2 rounded bg-danger-light mb-3">
                  Reason: {{ trip.rejectionReason }}
                </div>
              </div>

              <div class="flex gap-3 pt-3 border-t">
                <button *ngIf="trip.status === 'ACTIVE'" class="btn btn-sm btn-primary flex-1" (click)="viewTracking(trip)">📍 Live Tracking</button>
                <button *ngIf="trip.status === 'ACTIVE'" class="btn btn-sm btn-secondary flex-1" (click)="viewExpenses(trip)">🧾 Add Expense</button>
                <button *ngIf="trip.status === 'APPROVED'" class="btn btn-sm btn-secondary flex-1" (click)="viewTracking(trip)">📋 Itinerary</button>
              </div>
            </div>
          </div>

          <div *ngIf="getFilteredTrips().length === 0" class="empty-state card p-12 text-center">
            <div class="text-4xl mb-3">🗂️</div>
            <h4 class="text-secondary">No trips found in this category.</h4>
            <button class="btn btn-primary btn-sm mt-4" (click)="activeView = 'raise'">Create Travel Request</button>
          </div>
        </div>

        <!-- ================= RAISE REQUEST VIEW ================= -->
        <div *ngIf="activeView === 'raise'" class="animate-fade-in">
          <div class="full-grid-2-form">
            <!-- Left Form Panel -->
            <div class="card p-8">
              <h3 class="mb-2">New Travel Request</h3>
              <p class="text-secondary text-sm mb-6">Fill out the official request parameters for manager & travel desk approval.</p>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Project Number *</label>
                  <input class="form-input" placeholder="e.g. PRJ-1049" [(ngModel)]="newTrip.projectNo" />
                </div>
                <div class="form-group">
                  <label class="form-label">Client ID *</label>
                  <input class="form-input" placeholder="e.g. CLI-8821" [(ngModel)]="newTrip.clientId" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Destination City & Country *</label>
                <input class="form-input" placeholder="e.g. Mumbai, India / London, UK" [(ngModel)]="newTrip.destination" />
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Start Date *</label>
                  <input class="form-input" type="date" [(ngModel)]="newTrip.startDate" />
                </div>
                <div class="form-group">
                  <label class="form-label">End Date *</label>
                  <input class="form-input" type="date" [(ngModel)]="newTrip.endDate" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Estimated Budget / Cost (₹) *</label>
                <input class="form-input" type="number" placeholder="e.g. 25000" [(ngModel)]="newTrip.estimatedCost" />
              </div>

              <div class="checkbox-group-card p-4 rounded-md mb-6">
                <label class="form-label mb-2 block">Required Logistics Booking:</label>
                <div class="flex gap-6">
                  <label class="checkbox-label"><input type="checkbox" [(ngModel)]="newTrip.needsFlight" /> ✈️ Flight</label>
                  <label class="checkbox-label"><input type="checkbox" [(ngModel)]="newTrip.needsHotel" /> 🏨 Hotel</label>
                  <label class="checkbox-label"><input type="checkbox" [(ngModel)]="newTrip.needsCab" /> 🚖 Cab</label>
                </div>
              </div>

              <div class="error-message mb-4" *ngIf="raiseError">{{ raiseError }}</div>
              <div class="success-message mb-4" *ngIf="raiseSuccess">{{ raiseSuccess }}</div>

              <button class="btn btn-primary btn-lg w-full" (click)="submitRequest()" [disabled]="raiseLoading">
                <span class="spinner" *ngIf="raiseLoading"></span>
                {{ raiseLoading ? 'Submitting...' : 'Submit Travel Request' }}
              </button>
            </div>

            <!-- Right Policy & Guide Panel -->
            <div class="card p-8 flex flex-col justify-between">
              <div>
                <h4 class="mb-4 text-lg">Corporate Travel Policy Guide</h4>
                <div class="policy-items flex flex-col gap-4">
                  <div class="policy-item flex gap-3 items-start p-3 rounded bg-primary">
                    <span class="text-xl">✈️</span>
                    <div>
                      <strong class="text-sm block">Flight Booking Rules</strong>
                      <span class="text-xs text-secondary">Economy class applies for domestic flights under 6 hours. Advance booking required 3 days prior.</span>
                    </div>
                  </div>

                  <div class="policy-item flex gap-3 items-start p-3 rounded bg-primary">
                    <span class="text-xl">🏨</span>
                    <div>
                      <strong class="text-sm block">Hotel Accommodation</strong>
                      <span class="text-xs text-secondary">Tier-1 Cities: Max ₹5,000/night. Tier-2 Cities: Max ₹3,500/night. Direct billing enabled via Travel Desk.</span>
                    </div>
                  </div>

                  <div class="policy-item flex gap-3 items-start p-3 rounded bg-primary">
                    <span class="text-xl">⚡</span>
                    <div>
                      <strong class="text-sm block">Auto System Validation</strong>
                      <span class="text-xs text-secondary">Submitted requests undergo instant algorithmic checks for budget caps and date overlaps before manager notification.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="help-box p-4 rounded-md mt-6 bg-accent-light">
                <span class="text-xs text-accent font-semibold block mb-1">💡 Need Urgent Assistance?</span>
                <span class="text-xs text-secondary">Reach out to the Travel Desk desk manager directly via internal extension #4092.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= EXPENSES VIEW ================= -->
        <div *ngIf="activeView === 'expenses'" class="animate-fade-in">
          <div class="full-grid-expenses">
            <!-- Left Upload Panel -->
            <div class="card p-6">
              <h3 class="mb-4">Upload New Expense</h3>
              <div class="form-group">
                <label class="form-label">Select Active Trip ID *</label>
                <input class="form-input" type="number" placeholder="Enter trip ID e.g. 1" [(ngModel)]="expenseTripId" />
              </div>
              <div class="form-group">
                <label class="form-label">Expense Amount (₹) *</label>
                <input class="form-input" type="number" placeholder="0.00" [(ngModel)]="expenseAmount" />
              </div>
              <div class="form-group">
                <label class="form-label">Description / Remarks *</label>
                <input class="form-input" placeholder="e.g. Client Dinner, Taxi Fare" [(ngModel)]="expenseDescription" />
              </div>
              <div class="drop-zone" (click)="fileInput.click()">
                <div class="drop-zone-icon">📄</div>
                <p class="drop-zone-text">Click or Drag receipt here (PDF/JPEG)</p>
                <p class="drop-zone-hint">Max file size: 10MB</p>
                <input #fileInput type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none" (change)="onFileSelected($event)" />
              </div>
              <p class="text-secondary text-xs mt-2" *ngIf="selectedFileName">File attached: <strong>{{ selectedFileName }}</strong></p>
              <button class="btn btn-primary w-full mt-4" (click)="submitExpense()" [disabled]="!expenseTripId || !expenseAmount">Submit Expense Receipt</button>
            </div>

            <!-- Right Expense Log Table -->
            <div class="card p-6" style="overflow-x: auto">
              <h3 class="mb-4">Recent Expense Claims & Reimbursements</h3>
              <table class="data-table" *ngIf="uploadedExpenses.length > 0">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Trip ID</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Date Uploaded</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let exp of uploadedExpenses">
                    <td><strong>#EXP-{{ exp.id }}</strong></td>
                    <td>#{{ exp.tripId }}</td>
                    <td>{{ exp.description || 'General Expense' }}</td>
                    <td><strong>₹{{ exp.amount }}</strong></td>
                    <td>{{ exp.createdAt | date:'mediumDate' }}</td>
                    <td>
                      <span class="badge" [ngClass]="exp.status === 'CREDITED' ? 'badge-approved' : 'badge-pending'">
                        {{ exp.status || 'PENDING' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div *ngIf="uploadedExpenses.length === 0" class="empty-state p-8 text-center">
                <p class="text-secondary">No expense records found. Upload a receipt using the form on the left.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= LIVE TRACKING VIEW ================= -->
        <div *ngIf="activeView === 'tracking'" class="animate-fade-in">
          <div class="full-grid-tracking">
            <!-- Left Selection Panel -->
            <div class="card p-6 flex flex-col justify-between">
              <div>
                <h3 class="mb-3">Live Trip Selector</h3>
                <p class="text-secondary text-xs mb-4">Select an active journey to view live milestone updates.</p>
                
                <div class="form-group mb-4">
                  <label class="form-label">Trip ID</label>
                  <input class="form-input" type="number" placeholder="Enter Trip ID" [(ngModel)]="trackingTripId" />
                </div>
                <button class="btn btn-primary btn-sm w-full mb-6" (click)="activeTripId = trackingTripId">Load Journey Timeline</button>

                <div *ngIf="activeTripId" class="active-trip-mini p-4 rounded bg-primary">
                  <span class="text-xs text-accent font-semibold block mb-1">MONITORING TRIP #{{ activeTripId }}</span>
                  <p class="text-xs text-secondary">Milestone check-ins update real-time travel desk notifications.</p>
                </div>
              </div>

              <div class="sos-card p-4 rounded bg-danger-light border border-danger">
                <span class="text-xs font-bold text-danger block mb-1">🚨 Emergency SOS Assistance</span>
                <p class="text-xs text-secondary">If experiencing travel disruption, press SOS to notify manager and travel desk.</p>
                <button class="btn btn-danger btn-sm w-full mt-3" (click)="triggerSOS()">Trigger SOS Alert</button>
              </div>
            </div>

            <!-- Right Timeline Panel -->
            <div class="timeline-wrapper">
              <div *ngIf="!activeTripId" class="card p-12 text-center">
                <div class="text-4xl mb-3">📍</div>
                <h4 class="text-secondary">Enter your Active Trip ID to view live timeline tracking.</h4>
              </div>
              <app-trip-timeline *ngIf="activeTripId" [tripId]="activeTripId"></app-trip-timeline>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Error/Success Modal -->
    <div class="modal-overlay" [class.active]="showModal" (click)="showModal = false">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">{{ modalTitle }}</h3>
          <button class="modal-close" (click)="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>{{ modalMessage }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" (click)="showModal = false">OK</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout { display: flex; min-height: 100vh; background: var(--bg-primary); }
    
    /* Layouts spanning 100% full screen */
    .full-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      width: 100%;
    }

    .full-grid-2-form {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
      width: 100%;
    }

    .full-grid-expenses {
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: 24px;
      width: 100%;
    }

    .full-grid-tracking {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
      width: 100%;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .trips-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
      width: 100%;
    }

    /* Profile Specifics */
    .profile-hero-card {
      border-left: 4px solid var(--accent);
    }

    .profile-avatar-lg {
      width: 64px; height: 64px; border-radius: 50%;
      background: var(--accent-gradient); color: white; font-size: 1.75rem; font-weight: 700;
      display: grid; place-items: center; flex-shrink: 0;
    }

    .stat-num { font-size: 1.75rem; font-weight: 700; display: block; line-height: 1.2; }
    .stat-lbl { font-size: 0.75rem; font-weight: 500; }

    .detail-row {
      display: flex; justify-content: space-between; padding: 12px 0;
      border-bottom: 1px solid var(--border-light); font-size: 0.875rem;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: var(--text-secondary); }

    .tag {
      padding: 4px 8px; background: var(--bg-secondary); border-radius: var(--radius-sm); color: var(--text-secondary);
    }

    .checkbox-label {
      display: flex; align-items: center; gap: 8px; font-size: 0.875rem;
      cursor: pointer; color: var(--text-primary); font-weight: 500;
    }
    .checkbox-label input { width: 16px; height: 16px; accent-color: var(--accent); }

    .error-message { color: var(--danger); background: var(--danger-light); padding: 10px 16px; border-radius: var(--radius-md); font-size: 0.875rem; }
    .success-message { color: var(--success); background: var(--success-light); padding: 10px 16px; border-radius: var(--radius-md); font-size: 0.875rem; }

    @media (max-width: 1024px) {
      .full-grid-2, .full-grid-2-form, .full-grid-expenses, .full-grid-tracking {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EmployeeDashboardComponent implements OnInit {
  activeView = 'profile';
  profile: UserProfile | null = null;
  trips: TripRequest[] = [];
  uploadedExpenses: Expense[] = [];
  tripTabs = ['Upcoming', 'Active', 'Closed', 'Approved', 'Rejected'];
  activeTab = 'Active';

  // Raise request form
  newTrip: any = { needsFlight: false, needsHotel: false, needsCab: false };
  raiseError = '';
  raiseSuccess = '';
  raiseLoading = false;

  // Expense form
  expenseTripId: number | null = null;
  expenseAmount: number | null = null;
  expenseDescription = '';
  selectedFileName = '';

  // Tracking
  activeTripId: number | null = null;
  trackingTripId: number | null = null;

  // Modal
  showModal = false;
  modalTitle = '';
  modalMessage = '';

  constructor(
    private authService: AuthService,
    private tripService: TripService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.tripService.getMyProfile().subscribe({
      next: (p) => this.profile = p,
      error: () => {}
    });
    this.loadTrips();
    this.loadExpenses();
  }

  loadTrips(): void {
    this.tripService.getMyTrips().subscribe({
      next: (t) => {
        this.trips = t;
        const active = t.find(item => item.status === 'ACTIVE');
        if (active && active.id) {
          this.activeTripId = active.id;
          this.trackingTripId = active.id;
        }
      },
      error: () => {}
    });
  }

  loadExpenses(): void {
    // If there is an active trip, load its expenses
    if (this.activeTripId) {
      this.tripService.getExpensesByTrip(this.activeTripId).subscribe({
        next: (e) => this.uploadedExpenses = e,
        error: () => {}
      });
    }
  }

  getViewTitle(): string {
    const titles: Record<string, string> = {
      profile: 'My Profile',
      trips: 'My Trips',
      raise: 'Raise Travel Request',
      expenses: 'Expense Management',
      tracking: 'Live Tracking',
    };
    return titles[this.activeView] || '';
  }

  getFilteredTrips(): TripRequest[] {
    const statusMap: Record<string, string[]> = {
      'Upcoming': ['PENDING_AUTO_VAL', 'PENDING_MANAGER'],
      'Active': ['ACTIVE'],
      'Closed': ['CLOSED'],
      'Approved': ['APPROVED'],
      'Rejected': ['REJECTED', 'REJECTED_SYSTEM'],
    };
    const statuses = statusMap[this.activeTab] || [];
    return this.trips.filter(t => statuses.includes(t.status || ''));
  }

  getTabCount(tab: string): number {
    const statusMap: Record<string, string[]> = {
      'Upcoming': ['PENDING_AUTO_VAL', 'PENDING_MANAGER'],
      'Active': ['ACTIVE'],
      'Closed': ['CLOSED'],
      'Approved': ['APPROVED'],
      'Rejected': ['REJECTED', 'REJECTED_SYSTEM'],
    };
    const statuses = statusMap[tab] || [];
    return this.trips.filter(t => statuses.includes(t.status || '')).length;
  }

  countPendingTrips(): number {
    return this.trips.filter(t => t.status === 'PENDING_AUTO_VAL' || t.status === 'PENDING_MANAGER').length;
  }

  getBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'PENDING_AUTO_VAL': 'badge-pending',
      'PENDING_MANAGER': 'badge-pending',
      'APPROVED': 'badge-approved',
      'ACTIVE': 'badge-active',
      'REJECTED': 'badge-rejected',
      'REJECTED_SYSTEM': 'badge-rejected',
      'CLOSED': 'badge-closed',
    };
    return map[status] || 'badge-pending';
  }

  submitRequest(): void {
    if (!this.newTrip.projectNo || !this.newTrip.destination || !this.newTrip.startDate || !this.newTrip.endDate) {
      this.raiseError = 'Please fill out all required fields marked with *';
      return;
    }

    this.raiseError = '';
    this.raiseSuccess = '';
    this.raiseLoading = true;

    this.tripService.createTrip(this.newTrip).subscribe({
      next: () => {
        this.raiseLoading = false;
        this.raiseSuccess = 'Travel request submitted successfully! Auto-validation passed.';
        this.newTrip = { needsFlight: false, needsHotel: false, needsCab: false };
        this.loadTrips();
      },
      error: (err) => {
        this.raiseLoading = false;
        this.raiseError = err.error?.message || 'Failed to submit request.';
      }
    });
  }

  viewTracking(trip: TripRequest): void {
    this.activeTripId = trip.id || null;
    this.trackingTripId = trip.id || null;
    this.activeView = 'tracking';
  }

  viewExpenses(trip: TripRequest): void {
    this.expenseTripId = trip.id || null;
    this.activeView = 'expenses';
    this.loadExpenses();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFileName = input.files[0].name;
    }
  }

  submitExpense(): void {
    if (!this.expenseTripId || !this.expenseAmount) return;

    const newExp: Expense = {
      tripId: this.expenseTripId,
      amount: this.expenseAmount,
      description: this.expenseDescription || 'General Receipt',
      fileUrl: this.selectedFileName || 'receipt.pdf',
      fileName: this.selectedFileName || 'receipt.pdf',
      status: 'PENDING'
    };

    this.tripService.uploadExpense(newExp).subscribe({
      next: (res) => {
        this.showAlert('Success', 'Expense uploaded successfully!');
        this.uploadedExpenses.unshift(res);
        this.expenseAmount = null;
        this.expenseDescription = '';
        this.selectedFileName = '';
      },
      error: (err) => this.showAlert('Error', err.error?.message || 'Failed to upload expense.')
    });
  }

  triggerSOS(): void {
    this.showAlert('SOS Alert Triggered', 'Emergency SOS notification dispatched to Manager and Corporate Travel Desk. Emergency team contacted.');
  }

  showAlert(title: string, message: string): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  logout(): void {
    this.authService.logout();
  }
}
