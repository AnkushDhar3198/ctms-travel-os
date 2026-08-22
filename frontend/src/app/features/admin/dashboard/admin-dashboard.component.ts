import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TripService } from '../../../core/services/trip.service';
import { UserProfile, TripRequest } from '../../../core/models/models';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">✈</div>
          <span class="sidebar-brand-text">TravelOS</span>
        </div>
        <nav class="sidebar-nav">
          <button class="sidebar-link" [class.active]="view === 'overview'" (click)="view = 'overview'">
            <span class="sidebar-link-icon">⚙️</span> Overview
          </button>
          <button class="sidebar-link" [class.active]="view === 'users'" (click)="view = 'users'; loadUsers()">
            <span class="sidebar-link-icon">👥</span> Users
          </button>
          <button class="sidebar-link" [class.active]="view === 'trips'" (click)="view = 'trips'; loadTrips()">
            <span class="sidebar-link-icon">🗂️</span> All Trips
          </button>
          <button class="sidebar-link" [class.active]="view === 'sos'" (click)="view = 'sos'">
            <span class="sidebar-link-icon">🚨</span> SOS Risk
          </button>
          <button class="sidebar-link" [class.active]="view === 'analytics'" (click)="view = 'analytics'; loadAnalytics()">
            <span class="sidebar-link-icon">📊</span> Analytics
          </button>
        </nav>
        <div class="sidebar-footer">
          <button class="sidebar-link text-danger" (click)="authService.logout()">
            <span class="sidebar-link-icon">↪</span> Sign Out
          </button>
        </div>
      </aside>

      <main class="main-content">
        <!-- ==================== Overview ==================== -->
        <div *ngIf="view === 'overview'" class="animate-fade-in">
          <div class="page-header">
            <h2>System Administration</h2>
            <p class="text-secondary">Admin Dashboard</p>
          </div>
          <div class="stats-grid stagger-children">
            <div class="card stat-card p-6" (click)="view = 'users'; loadUsers()">
              <div class="stat-icon">👥</div>
              <h3 class="stat-value">{{ userCount }}</h3>
              <p class="stat-label">Users</p>
            </div>
            <div class="card stat-card p-6" (click)="view = 'trips'; loadTrips()">
              <div class="stat-icon">🗂️</div>
              <h3 class="stat-value">{{ tripCount }}</h3>
              <p class="stat-label">Total Trips</p>
            </div>
            <div class="card stat-card p-6" (click)="view = 'sos'">
              <div class="stat-icon">🚨</div>
              <h3 class="stat-value">—</h3>
              <p class="stat-label">SOS Risk</p>
            </div>
            <div class="card stat-card p-6" (click)="view = 'analytics'; loadAnalytics()">
              <div class="stat-icon">📊</div>
              <h3 class="stat-value">{{ activeTripsCount }}</h3>
              <p class="stat-label">Active Trips</p>
            </div>
          </div>
        </div>

        <!-- ==================== Users ==================== -->
        <div *ngIf="view === 'users'" class="animate-fade-in">
          <div class="page-header flex justify-between items-center">
            <div>
              <h2>User Management</h2>
              <p class="text-secondary">{{ users.length }} users registered</p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="view = 'overview'">← Back</button>
          </div>
          <div class="card" style="overflow-x: auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Joined</th>
                  <th>Active Trips</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of users" (click)="openUserModal(user)" style="cursor: pointer;">
                  <td><strong>{{ user.empId }}</strong></td>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="user-avatar">{{ user.name?.charAt(0) }}</div>
                      {{ user.name }}
                    </div>
                  </td>
                  <td><span class="badge" [ngClass]="getRoleBadge(user.role)">{{ user.role }}</span></td>
                  <td>{{ user.department || '—' }}</td>
                  <td>{{ user.designation || '—' }}</td>
                  <td>{{ user.dateOfJoining || '—' }}</td>
                  <td class="text-center">{{ user.activeTripsCount }}</td>
                  <td><span class="badge" [ngClass]="user.isActive ? 'badge-approved' : 'badge-rejected'">{{ user.isActive ? 'Active' : 'Inactive' }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ==================== All Trips ==================== -->
        <div *ngIf="view === 'trips'" class="animate-fade-in">
          <div class="page-header flex justify-between items-center">
            <div>
              <h2>All Trips</h2>
              <p class="text-secondary">{{ trips.length }} total trip records</p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="view = 'overview'">← Back</button>
          </div>

          <div class="tab-nav mb-4">
            <button class="tab-item" [class.active]="tripFilter === 'ALL'" (click)="tripFilter = 'ALL'">All ({{ trips.length }})</button>
            <button class="tab-item" [class.active]="tripFilter === 'ACTIVE'" (click)="tripFilter = 'ACTIVE'">Active ({{ countByStatus('ACTIVE') }})</button>
            <button class="tab-item" [class.active]="tripFilter === 'APPROVED'" (click)="tripFilter = 'APPROVED'">Approved ({{ countByStatus('APPROVED') }})</button>
            <button class="tab-item" [class.active]="tripFilter === 'PENDING'" (click)="tripFilter = 'PENDING'">Pending ({{ countPending() }})</button>
            <button class="tab-item" [class.active]="tripFilter === 'CLOSED'" (click)="tripFilter = 'CLOSED'">Closed ({{ countByStatus('CLOSED') }})</button>
            <button class="tab-item" [class.active]="tripFilter === 'REJECTED'" (click)="tripFilter = 'REJECTED'">Rejected ({{ countRejected() }})</button>
          </div>

          <div class="card" style="overflow-x: auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Destination</th>
                  <th>Project</th>
                  <th>Dates</th>
                  <th>Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let trip of getFilteredTrips()" (click)="openTripModal(trip)" style="cursor: pointer;">
                  <td><strong>#{{ trip.id }}</strong></td>
                  <td>{{ trip.employeeName }} ({{ trip.employeeEmpId }})</td>
                  <td>{{ trip.destination }}</td>
                  <td>{{ trip.projectNo }}</td>
                  <td>{{ trip.startDate }} → {{ trip.endDate }}</td>
                  <td>₹{{ trip.estimatedCost }}</td>
                  <td><span class="badge" [ngClass]="getStatusBadge(trip.status || '')">{{ trip.status }}</span></td>
                </tr>
                <tr *ngIf="getFilteredTrips().length === 0">
                  <td colspan="7" class="text-center text-secondary p-8">No trips found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ==================== SOS Risk ==================== -->
        <div *ngIf="view === 'sos'" class="animate-fade-in">
          <div class="page-header flex justify-between items-center">
            <div>
              <h2>SOS Risk Monitor</h2>
              <p class="text-secondary">Employee safety tracking</p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="view = 'overview'">← Back</button>
          </div>
          <div class="card p-8 text-center w-full">
            <div style="font-size: 4rem; margin-bottom: 16px">🚨</div>
            <h3>Coming Soon</h3>
            <p class="text-secondary mt-2">The SOS Risk feature will allow real-time monitoring of employee safety during active trips, with automated alerts for missed check-ins and emergency contact integration.</p>
            <div class="feature-list mt-6">
              <div class="feature-item"><span class="feature-dot pending"></span> Missed check-in alerts</div>
              <div class="feature-item"><span class="feature-dot pending"></span> Emergency SOS button</div>
              <div class="feature-item"><span class="feature-dot pending"></span> Location-based risk scoring</div>
            </div>
          </div>
        </div>

        <!-- ==================== Analytics ==================== -->
        <div *ngIf="view === 'analytics'" class="animate-fade-in">
          <div class="page-header flex justify-between items-center">
            <div>
              <h2>Travel Analytics & Intelligence</h2>
              <p class="text-secondary">System-wide metrics and breakdowns</p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="view = 'overview'">← Back</button>
          </div>

          <div class="analytics-grid">
            <div class="card metric-card p-6">
              <div class="metric-label">Total Registered Users</div>
              <div class="metric-value">{{ userCount }}</div>
              <div class="metric-breakdown">
                <span class="badge badge-active">{{ countRole('EMPLOYEE') }} Employees</span>
                <span class="badge badge-pending">{{ countRole('MANAGER') }} Managers</span>
                <span class="badge badge-approved">{{ countRole('TRAVEL_DESK') }} Travel Desk</span>
              </div>
            </div>

            <div class="card metric-card p-6">
              <div class="metric-label">Total Trip Requests</div>
              <div class="metric-value">{{ tripCount }}</div>
              <div class="metric-breakdown">
                <span class="badge badge-active">{{ activeTripsCount }} Active</span>
                <span class="badge badge-approved">{{ countByStatus('APPROVED') }} Approved</span>
                <span class="badge badge-pending">{{ countPending() }} Pending</span>
              </div>
            </div>

            <div class="card chart-card p-6">
              <h4 class="mb-4">Trip Status Distribution</h4>
              <div class="status-bars">
                <div *ngFor="let s of statusBreakdown" class="bar-row">
                  <span class="bar-label">{{ s.label }}</span>
                  <div class="bar-track">
                    <div class="bar-fill" [ngClass]="s.colorClass" [style.width.%]="getBarWidth(s.count)"></div>
                  </div>
                  <span class="bar-count">{{ s.count }}</span>
                </div>
              </div>
            </div>

            <div class="card chart-card p-6">
              <h4 class="mb-4">Department Distribution</h4>
              <div class="dept-grid">
                <div *ngFor="let d of deptBreakdown" class="dept-item">
                  <div class="dept-count">{{ d.count }}</div>
                  <div class="dept-name">{{ d.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Admin Complete End-to-End Trip Details Modal -->
    <div class="modal-overlay" [class.active]="showTripModal" (click)="showTripModal = false">
      <div class="modal-container modal-container-lg" (click)="$event.stopPropagation()" style="max-width: 780px;">
        <div class="modal-header">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl">🗂️</span>
              <h3 class="modal-title">Trip #{{ selectedTrip?.id }} · Complete End-to-End Details</h3>
            </div>
            <p class="text-xs text-secondary mt-1">Employee: <strong>{{ selectedTrip?.employeeName }}</strong> ({{ selectedTrip?.employeeEmpId }}) · {{ selectedTrip?.destination }}</p>
          </div>
          <button class="modal-close" (click)="showTripModal = false">✕</button>
        </div>
        
        <div class="modal-body" *ngIf="selectedTrip" style="max-height: 76vh; overflow-y: auto;">
          <!-- 1. Executive Summary -->
          <div class="p-4 rounded-xl mb-4 bg-primary border" style="border-color: var(--border-light);">
            <div class="flex justify-between items-start flex-wrap gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-lg font-bold">{{ selectedTrip.destination }}</h4>
                  <span class="badge" [ngClass]="getStatusBadge(selectedTrip.status || '')">{{ selectedTrip.status }}</span>
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
            <div class="mt-2 pt-2 border-t text-xs text-danger" *ngIf="selectedTrip.rejectionReason">
              <span>❌ Rejection Reason:</span>
              <p class="font-semibold mt-0.5">{{ selectedTrip.rejectionReason }}</p>
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
                  <span class="return-badge-pill" style="font-size: 0.5625rem; font-weight: 800; color: #AF52DE; background: rgba(175, 82, 222, 0.12); padding: 1px 6px; border-radius: 4px;">RETURN</span>
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
                <p><strong>Assigned Kit:</strong> {{ selectedTrip.itinerary?.allocatedAssets || 'None' }}</p>
              </div>
            </div>
          </div>

          <!-- 3. Milestones & Verifications Timeline Table -->
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

          <!-- 4. Associated Expenses Summary -->
          <div class="section-label mb-2 font-bold text-sm" *ngIf="selectedTrip.expenses && selectedTrip.expenses.length > 0">
            🧾 Submitted Expenses ({{ selectedTrip.expenses.length }} items)
          </div>
          
          <div class="detail-section p-4 rounded-xl mb-4 bg-primary border" style="border-color: var(--border-light);" *ngIf="selectedTrip.expenses && selectedTrip.expenses.length > 0">
            <div style="overflow-x: auto;">
              <table class="w-full text-xs" style="border-collapse: collapse;">
                <thead>
                  <tr class="border-b text-tertiary text-left">
                    <th class="py-2">Description</th>
                    <th class="py-2">Receipt</th>
                    <th class="py-2">Date</th>
                    <th class="py-2">Amount</th>
                    <th class="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let exp of selectedTrip.expenses" class="border-b">
                    <td class="py-2 font-medium">{{ exp.description || 'Expense Claim' }}</td>
                    <td class="py-2 text-secondary">{{ exp.fileName || 'receipt.pdf' }}</td>
                    <td class="py-2 text-secondary">{{ (exp.createdAt | date:'shortDate') || '—' }}</td>
                    <td class="py-2 font-bold text-accent">₹{{ exp.amount | number }}</td>
                    <td class="py-2 text-right">
                      <span class="badge" [ngClass]="exp.status === 'CREDITED' ? 'badge-approved' : 'badge-pending'">
                        {{ exp.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" (click)="showTripModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Smooth User Profile Modal Popup -->
    <div class="modal-overlay" [class.active]="showUserModal" (click)="showUserModal = false">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Employee #{{ selectedUser?.empId }}</h3>
          <button class="modal-close" (click)="showUserModal = false">✕</button>
        </div>
        <div class="modal-body" *ngIf="selectedUser">
          <div class="flex items-center gap-4 mb-4 p-4 rounded bg-primary">
            <div class="user-avatar" style="width:48px; height:48px; font-size:1.25rem">{{ selectedUser.name?.charAt(0) }}</div>
            <div>
              <h4 class="text-base font-bold">{{ selectedUser.name }}</h4>
              <span class="text-xs text-secondary">{{ selectedUser.designation || 'Staff' }} · {{ selectedUser.department || 'Corporate' }}</span>
            </div>
          </div>
          <div class="details-list">
            <div class="detail-row"><span class="detail-label">System Role</span><span class="badge" [ngClass]="getRoleBadge(selectedUser.role)">{{ selectedUser.role }}</span></div>
            <div class="detail-row"><span class="detail-label">Account Status</span><span class="badge" [ngClass]="selectedUser.isActive ? 'badge-approved' : 'badge-rejected'">{{ selectedUser.isActive ? 'Active' : 'Inactive' }}</span></div>
            <div class="detail-row"><span class="detail-label">Contact</span><strong>{{ selectedUser.contact || '—' }}</strong></div>
            <div class="detail-row"><span class="detail-label">Date of Joining</span><strong>{{ selectedUser.dateOfJoining || '—' }}</strong></div>
            <div class="detail-row"><span class="detail-label">Total Trips Created</span><strong>{{ selectedUser.totalTrips }}</strong></div>
            <div class="detail-row"><span class="detail-label">Active Trips</span><strong>{{ selectedUser.activeTripsCount }}</strong></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" (click)="showUserModal = false">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout { display: flex; min-height: 100vh; background: var(--bg-primary); }
    .page-header { margin-bottom: 32px; }
    .page-header h2 { font-size: 1.75rem; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
    .stat-card { text-align: center; transition: var(--transition-normal); cursor: pointer; }
    .stat-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }
    .stat-icon { font-size: 2.5rem; margin-bottom: 8px; }
    .stat-value { font-size: 2rem; font-weight: 700; margin-bottom: 4px; }
    .stat-label { font-size: 0.875rem; color: var(--text-secondary); }

    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--accent-gradient); color: white;
      display: grid; place-items: center; font-weight: 600; font-size: 0.8rem;
      flex-shrink: 0;
    }

    /* SOS Feature list */
    .feature-list { text-align: left; max-width: 300px; margin: 0 auto; }
    .feature-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; font-size: 0.9375rem; color: var(--text-secondary); }
    .feature-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .feature-dot.pending { background: var(--warning); }

    /* Analytics */
    .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
    .metric-card { }
    .metric-label { font-size: 0.8125rem; color: var(--text-secondary); font-weight: 500; margin-bottom: 4px; }
    .metric-value { font-size: 2.25rem; font-weight: 700; margin-bottom: 12px; }
    .metric-breakdown { display: flex; gap: 8px; flex-wrap: wrap; }
    .chart-card { grid-column: span 2; }

    /* Bar chart */
    .status-bars { display: flex; flex-direction: column; gap: 12px; }
    .bar-row { display: flex; align-items: center; gap: 12px; }
    .bar-label { width: 120px; font-size: 0.8125rem; color: var(--text-secondary); text-align: right; flex-shrink: 0; }
    .bar-track { flex: 1; height: 24px; background: var(--bg-secondary); border-radius: 12px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 12px; transition: width 0.8s var(--ease-apple); min-width: 2px; }
    .bar-fill.fill-active { background: var(--accent); }
    .bar-fill.fill-approved { background: var(--success); }
    .bar-fill.fill-pending { background: var(--warning); }
    .bar-fill.fill-rejected { background: var(--danger); }
    .bar-fill.fill-closed { background: var(--text-tertiary); }
    .bar-count { width: 30px; font-size: 0.875rem; font-weight: 600; }

    /* Department grid */
    .dept-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; }
    .dept-item { text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md); }
    .dept-count { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
    .dept-name { font-size: 0.8125rem; color: var(--text-secondary); margin-top: 4px; }

    @media (max-width: 768px) {
      .chart-card { grid-column: span 1; }
      .bar-label { width: 80px; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  view = 'overview';
  users: UserProfile[] = [];
  trips: TripRequest[] = [];
  tripFilter = 'ALL';

  userCount = 0;
  tripCount = 0;
  activeTripsCount = 0;

  statusBreakdown: { label: string; count: number; colorClass: string }[] = [];
  deptBreakdown: { name: string; count: number }[] = [];
  userFilter = 'ALL';
  showUserModal = false;
  selectedUser: UserProfile | null = null;
  showTripModal = false;
  selectedTrip: TripRequest | null = null;

  constructor(public authService: AuthService, private tripService: TripService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadTrips();
  }

  loadUsers(): void {
    this.tripService.getAllUsers().subscribe({
      next: (u) => {
        this.users = u;
        this.userCount = u.length;
        this.buildDeptBreakdown();
      },
      error: () => {}
    });
  }

  loadTrips(): void {
    this.tripService.getAllTrips().subscribe({
      next: (t) => {
        this.trips = t;
        this.tripCount = t.length;
        this.activeTripsCount = this.countByStatus('ACTIVE');
        this.buildStatusBreakdown();
      },
      error: () => {}
    });
  }

  loadAnalytics(): void {
    this.loadUsers();
    this.loadTrips();
  }

  openUserModal(user: UserProfile): void {
    this.selectedUser = user;
    this.showUserModal = true;
  }

  openTripModal(trip: TripRequest): void {
    this.selectedTrip = trip;
    this.showTripModal = true;
    if (trip.id) {
      this.tripService.getTripById(trip.id).subscribe({
        next: (full) => this.selectedTrip = full,
        error: () => {}
      });
    }
  }

  getFilteredTrips(): TripRequest[] {
    if (this.tripFilter === 'ALL') return this.trips;
    if (this.tripFilter === 'PENDING') return this.trips.filter(t => t.status === 'PENDING_AUTO_VAL' || t.status === 'PENDING_MANAGER');
    if (this.tripFilter === 'REJECTED') return this.trips.filter(t => t.status === 'REJECTED' || t.status === 'REJECTED_SYSTEM');
    return this.trips.filter(t => t.status === this.tripFilter);
  }

  countByStatus(status: string): number {
    return this.trips.filter(t => t.status === status).length;
  }

  countPending(): number {
    return this.trips.filter(t => t.status === 'PENDING_AUTO_VAL' || t.status === 'PENDING_MANAGER').length;
  }

  countRejected(): number {
    return this.trips.filter(t => t.status === 'REJECTED' || t.status === 'REJECTED_SYSTEM').length;
  }

  countRole(role: string): number {
    return this.users.filter(u => u.role === role).length;
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'PENDING_AUTO_VAL': 'badge-pending', 'PENDING_MANAGER': 'badge-pending',
      'APPROVED': 'badge-approved', 'ACTIVE': 'badge-active',
      'REJECTED': 'badge-rejected', 'REJECTED_SYSTEM': 'badge-rejected', 'CLOSED': 'badge-closed'
    };
    return map[status] || 'badge-pending';
  }

  getRoleBadge(role: string): string {
    const map: Record<string, string> = {
      'EMPLOYEE': 'badge-active', 'MANAGER': 'badge-pending',
      'TRAVEL_DESK': 'badge-approved', 'FINANCE': 'badge-closed', 'ADMIN': 'badge-rejected'
    };
    return map[role] || 'badge-closed';
  }

  getBarWidth(count: number): number {
    const max = Math.max(...this.statusBreakdown.map(s => s.count), 1);
    return (count / max) * 100;
  }

  private buildStatusBreakdown(): void {
    this.statusBreakdown = [
      { label: 'Active', count: this.countByStatus('ACTIVE'), colorClass: 'fill-active' },
      { label: 'Approved', count: this.countByStatus('APPROVED'), colorClass: 'fill-approved' },
      { label: 'Pending', count: this.countPending(), colorClass: 'fill-pending' },
      { label: 'Rejected', count: this.countRejected(), colorClass: 'fill-rejected' },
      { label: 'Closed', count: this.countByStatus('CLOSED'), colorClass: 'fill-closed' },
    ];
  }

  private buildDeptBreakdown(): void {
    const depts: Record<string, number> = {};
    this.users.forEach(u => {
      const dept = u.department || 'Unknown';
      depts[dept] = (depts[dept] || 0) + 1;
    });
    this.deptBreakdown = Object.entries(depts).map(([name, count]) => ({ name, count }));
  }
}
