import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TripService } from '../../../core/services/trip.service';
import { FlightService } from '../../../core/services/flight.service';
import { UserProfile, TripRequest, Expense, TripClosureCheck, CitySuggestion } from '../../../core/models/models';

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
            <button *ngFor="let tab of tripTabs; trackBy: trackByTab" class="tab-item" [class.active]="activeTab === tab" (click)="setActiveTab(tab)">
              {{ tab }} ({{ getTabCount(tab) }})
            </button>
          </div>

          <!-- Full Width Multi-Column Cards Grid -->
          <div class="trips-cards-grid" *ngIf="filteredTrips.length > 0">
            <div *ngFor="let trip of filteredTrips; trackBy: trackByTripId" class="card trip-card p-6 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <span class="text-xs text-tertiary uppercase tracking-wider font-semibold">TRIP #{{ trip.id }}</span>
                    <h3 class="text-lg font-bold mt-1">{{ trip.destination }}</h3>
                  </div>
                  <span class="badge" [ngClass]="getBadgeClass(trip.status || '')">{{ trip.status }}</span>
                </div>

                <div class="trip-info-box p-3 rounded-md mb-3 bg-primary">
                  <div class="flex justify-between text-xs text-secondary mb-1">
                    <span>Project: <strong>{{ trip.projectNo }}</strong></span>
                    <span>Client: <strong>{{ trip.clientId }}</strong></span>
                  </div>
                  <div class="flex justify-between text-xs text-secondary">
                    <span>Dates: <strong>{{ trip.startDate }} → {{ trip.endDate }}</strong></span>
                    <span>Est: <strong>₹{{ trip.estimatedCost | number }}</strong></span>
                  </div>
                  <div class="text-xs text-secondary mt-1" *ngIf="trip.extraLuggageKg">
                    Extra Baggage: <strong>+{{ trip.extraLuggageKg }} kg</strong>
                  </div>
                </div>

                <!-- Confirmed Itinerary Highlights (When Booked by Travel Desk) -->
                <div class="itinerary-preview-box p-3 rounded-lg mb-3" *ngIf="trip.itinerary && (trip.status === 'ACTIVE' || trip.status === 'CLOSED' || trip.status === 'APPROVED')">
                  <div class="text-xs font-bold text-accent mb-2 flex items-center justify-between">
                    <span>✈️ Confirmed Itinerary</span>
                    <span class="badge badge-active text-2xs" *ngIf="trip.itinerary.pnr">PNR: {{ trip.itinerary.pnr }}</span>
                  </div>

                  <div class="text-xs text-secondary mb-1" *ngIf="trip.itinerary.flightDetails">
                    ✈️ <strong>{{ trip.itinerary.flightDetails }}</strong>
                  </div>

                  <div class="text-xs text-secondary mb-1" *ngIf="trip.itinerary.hotelName">
                    🏨 <strong>{{ trip.itinerary.hotelName }}</strong>
                  </div>

                  <div class="text-xs text-secondary mb-1" *ngIf="trip.itinerary.cabDriverName">
                    🚕 <strong>{{ trip.itinerary.cabDriverName }}</strong> ({{ trip.itinerary.cabNumber }})
                  </div>

                  <div class="text-xs text-secondary" *ngIf="trip.itinerary.allocatedAssets">
                    💼 <strong>{{ trip.itinerary.allocatedAssets }}</strong>
                  </div>
                </div>

                <!-- Approved / Booking in progress status badge -->
                <div *ngIf="trip.status === 'APPROVED' && !trip.itinerary?.flightDetails" class="p-2 rounded bg-primary text-xs text-secondary mb-3 flex items-center gap-2">
                  <span>⏳</span>
                  <span>Approved by manager · Travel Desk is preparing your flight & itinerary</span>
                </div>

                <div class="flex gap-2 text-xs mb-3">
                  <span class="tag" *ngIf="trip.needsFlight">✈️ Flight Required</span>
                  <span class="tag" *ngIf="trip.needsHotel">🏨 Hotel Required</span>
                  <span class="tag" *ngIf="trip.needsCab">🚖 Cab Required</span>
                </div>

                <div *ngIf="trip.rejectionReason" class="text-xs text-danger p-2 rounded bg-danger-light mb-3">
                  Reason: {{ trip.rejectionReason }}
                </div>
              </div>

              <div class="flex gap-2 pt-3 border-t flex-wrap">
                <button class="btn btn-sm btn-secondary flex-1" (click)="openTripDetails(trip)">🔍 Details</button>
                <button *ngIf="trip.status === 'ACTIVE' || trip.status === 'APPROVED'" class="btn btn-sm btn-primary flex-1" (click)="viewTracking(trip)">📍 Track</button>
                <button *ngIf="trip.status === 'ACTIVE'" class="btn btn-sm btn-secondary flex-1" (click)="viewExpenses(trip)">🧾 Expense</button>
                <button *ngIf="trip.status === 'ACTIVE'" class="btn btn-sm btn-danger flex-1" (click)="openClosureModal(trip)">🏁 Close Trip</button>
              </div>
            </div>
          </div>

          <div *ngIf="filteredTrips.length === 0" class="empty-state card p-12 text-center">
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

              <div class="form-group apple-autocomplete-wrap">
                <label class="form-label flex justify-between">
                  <span>Destination City & Country *</span>
                  <span class="text-xs text-accent cursor-pointer" (click)="showDestDropdown = !showDestDropdown">
                    {{ showDestDropdown ? 'Hide Suggestions' : 'Popular Hubs' }}
                  </span>
                </label>
                <input
                  class="form-input"
                  placeholder="e.g. Bengaluru, India / London, UK / Mumbai"
                  [(ngModel)]="newTrip.destination"
                  (focus)="showDestDropdown = true"
                  (input)="onDestInput()"
                />

                <!-- Apple-style Translucent Destination Dropdown -->
                <div *ngIf="showDestDropdown && filteredCities.length > 0" class="apple-autocomplete-dropdown">
                  <div class="apple-dropdown-header">
                    <span>Popular Business Travel Hubs</span>
                    <span class="text-xs text-secondary">{{ filteredCities.length }} hubs</span>
                  </div>
                  <div *ngFor="let city of filteredCities; trackBy: trackByCityName" class="apple-dropdown-item" (click)="selectCity(city)">
                    <div class="apple-dropdown-left">
                      <div class="apple-dropdown-icon">📍</div>
                      <div>
                        <div class="apple-dropdown-title">{{ city.name }}, {{ city.country }}</div>
                        <div class="apple-dropdown-subtitle">Airport: {{ city.airportCode }} Intl</div>
                      </div>
                    </div>
                    <div class="apple-dropdown-right">
                      <span class="apple-dropdown-badge">{{ city.airportCode }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Apple-Style Interactive Date Selection UI -->
              <div class="apple-date-selector-card p-4 rounded-xl mb-4">
                <div class="flex justify-between items-center mb-3 flex-wrap gap-2">
                  <label class="form-label mb-0 flex items-center gap-1 font-semibold">
                    <span>📅</span> Travel Dates & Duration *
                  </label>
                  <span class="duration-pill" *ngIf="newTrip.startDate && newTrip.endDate && !isDateInvalid()">
                    {{ getTripDurationText() }}
                  </span>
                </div>

                <!-- Apple Quick Date Preset Pills -->
                <div class="apple-segmented-bar mb-3">
                  <button class="apple-segment-pill" [class.active]="datePreset === '3-days'" (click)="applyDatePreset('3-days')">3-Day Trip</button>
                  <button class="apple-segment-pill" [class.active]="datePreset === 'next-week'" (click)="applyDatePreset('next-week')">Next Week</button>
                  <button class="apple-segment-pill" [class.active]="datePreset === '1-week'" (click)="applyDatePreset('1-week')">1-Week</button>
                  <button class="apple-segment-pill" [class.active]="datePreset === '2-weeks'" (click)="applyDatePreset('2-weeks')">2-Weeks</button>
                  <button class="apple-segment-pill" [class.active]="datePreset === 'custom'" (click)="datePreset = 'custom'">Custom</button>
                </div>

                <!-- Dual Date Pickers Grid -->
                <div class="date-pickers-grid">
                  <!-- Start Date Card -->
                  <div class="date-picker-box p-3 rounded-lg bg-surface">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-tertiary font-semibold uppercase">🛫 Departure Date</span>
                      <span class="text-xs text-accent font-semibold">Start</span>
                    </div>
                    <div class="date-display-val text-sm font-bold my-1 text-primary">
                      {{ getFormattedDate(newTrip.startDate) || 'Select departure date' }}
                    </div>
                    <input
                      class="form-input form-input-apple-date mt-1 w-full"
                      type="date"
                      [min]="todayStr"
                      [(ngModel)]="newTrip.startDate"
                      (change)="onStartDateChange()"
                    />
                  </div>

                  <!-- End Date Card -->
                  <div class="date-picker-box p-3 rounded-lg bg-surface">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-tertiary font-semibold uppercase">🛬 Return Date</span>
                      <span class="text-xs text-accent font-semibold">End</span>
                    </div>
                    <div class="date-display-val text-sm font-bold my-1 text-primary">
                      {{ getFormattedDate(newTrip.endDate) || 'Select return date' }}
                    </div>
                    <input
                      class="form-input form-input-apple-date mt-1 w-full"
                      type="date"
                      [min]="newTrip.startDate || todayStr"
                      [(ngModel)]="newTrip.endDate"
                      (change)="onEndDateChange()"
                    />
                  </div>
                </div>

                <div *ngIf="isDateInvalid()" class="text-xs text-danger mt-2 font-medium">
                  ⚠️ Return date cannot be earlier than departure date.
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
                  <tr *ngFor="let exp of uploadedExpenses; trackBy: trackByExpId">
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
                <h3 class="mb-2">Live Trip Selector</h3>
                <p class="text-secondary text-xs mb-4">Select a journey to view and update real-time milestones.</p>
                
                <!-- Quick Trip Picker from User's Trips -->
                <div class="trips-picker-list mb-4" *ngIf="trips.length > 0">
                  <label class="form-label text-xs font-semibold mb-2 block">Your Journeys</label>
                  <div class="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    <div
                      *ngFor="let t of trips; trackBy: trackByTripId"
                      class="quick-trip-item p-3 rounded-lg cursor-pointer transition-all border"
                      [class.active-selected]="activeTripId === t.id"
                      (click)="selectTrackingTrip(t.id)"
                    >
                      <div class="flex justify-between items-center mb-1">
                        <strong class="text-xs">Trip #{{ t.id }}</strong>
                        <span class="badge text-2xs" [ngClass]="getBadgeClass(t.status || '')">{{ t.status }}</span>
                      </div>
                      <div class="text-xs text-primary font-medium truncate">📍 {{ t.destination }}</div>
                      <div class="text-2xs text-secondary mt-1">🗓️ {{ t.startDate }} → {{ t.endDate }}</div>
                    </div>
                  </div>
                </div>

                <!-- Manual Input Fallback -->
                <div class="form-group mb-3">
                  <label class="form-label text-xs">Manual Trip ID</label>
                  <div class="flex gap-2">
                    <input class="form-input text-xs flex-1" type="number" placeholder="Enter Trip ID" [(ngModel)]="trackingTripId" (keydown.enter)="selectTrackingTrip(trackingTripId)" />
                    <button class="btn btn-primary btn-sm" (click)="selectTrackingTrip(trackingTripId)">Load</button>
                  </div>
                </div>

                <div *ngIf="activeTripId" class="active-trip-mini p-3 rounded bg-primary mb-4">
                  <span class="text-xs text-accent font-semibold block mb-1">MONITORING TRIP #{{ activeTripId }}</span>
                  <p class="text-2xs text-secondary">Milestone check-ins sync with travel desk & management in real-time.</p>
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

    <!-- Smooth Complete End-to-End Trip Details Modal Popup -->
    <div class="modal-overlay" [class.active]="showDetailsModal" (click)="showDetailsModal = false">
      <div class="modal-container modal-container-lg" (click)="$event.stopPropagation()" style="max-width: 780px;">
        <div class="modal-header">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl">🗂️</span>
              <h3 class="modal-title">Trip #{{ selectedTrip?.id }} · Complete End-to-End Details</h3>
            </div>
            <p class="text-xs text-secondary mt-1">{{ selectedTrip?.destination }} · {{ selectedTrip?.startDate }} → {{ selectedTrip?.endDate }}</p>
          </div>
          <button class="modal-close" (click)="showDetailsModal = false">✕</button>
        </div>

        <div class="modal-body" *ngIf="selectedTrip" style="max-height: 76vh; overflow-y: auto;">
          <!-- 1. Executive Trip Summary Banner -->
          <div class="p-4 rounded-xl mb-4 bg-primary border" style="border-color: var(--border-light);">
            <div class="flex justify-between items-start flex-wrap gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-lg font-bold">{{ selectedTrip.destination }}</h4>
                  <span class="badge" [ngClass]="getBadgeClass(selectedTrip.status || '')">{{ selectedTrip.status }}</span>
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
                <p class="font-semibold mt-0.5">{{ selectedTrip.extraLuggageKg ? '+' + selectedTrip.extraLuggageKg + ' kg Authorized' : 'Standard Allowance' }}</p>
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
              <span class="text-tertiary">💬 Manager Remarks:</span>
              <p class="italic text-secondary mt-0.5">{{ selectedTrip.remarks }}</p>
            </div>
            <div class="mt-2 pt-2 border-t text-xs text-danger" *ngIf="selectedTrip.rejectionReason">
              <span>❌ Rejection Reason:</span>
              <p class="font-semibold mt-0.5">{{ selectedTrip.rejectionReason }}</p>
            </div>
          </div>

          <!-- 2. End-to-End Confirmed Travel Itinerary -->
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
                <p><strong>Flight Details:</strong> {{ selectedTrip.itinerary?.flightDetails || 'Pending Booking by Travel Desk' }}</p>
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

            <!-- Hotel Accommodation -->
            <div class="detail-section p-4 rounded-xl bg-primary border" style="border-color: var(--border-light);">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-base">🏨</span>
                <h4 class="text-sm font-bold text-accent">Hotel Stay & Accommodation</h4>
              </div>
              <div class="text-xs text-secondary leading-relaxed">
                <p><strong>Hotel Name:</strong> {{ selectedTrip.itinerary?.hotelName || 'Pending Allocation' }}</p>
                <p *ngIf="selectedTrip.itinerary?.hotelAddress" class="mt-1"><strong>Address:</strong> {{ selectedTrip.itinerary?.hotelAddress }}</p>
              </div>
            </div>

            <!-- Cab & Local Transport -->
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
                <p><strong>Assigned Equipment:</strong> {{ selectedTrip.itinerary?.allocatedAssets || 'Standard Corporate Travel Kit' }}</p>
              </div>
            </div>
          </div>

          <!-- 3. Scheduled Checklist Timeline vs Live Execution Milestones -->
          <div class="section-label mb-2 font-bold text-sm">📍 End-to-End Milestones & Verification Timeline</div>
          
          <div class="detail-section p-4 rounded-xl mb-4 bg-primary border" style="border-color: var(--border-light);">
            <div class="milestones-table-wrap" style="overflow-x: auto;">
              <table class="w-full text-xs" style="border-collapse: collapse;">
                <thead>
                  <tr class="border-b text-tertiary" style="text-align: left;">
                    <th class="py-2">Milestone</th>
                    <th class="py-2">Scheduled Time</th>
                    <th class="py-2">Actual Timestamp</th>
                    <th class="py-2">Verification Proof</th>
                    <th class="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- 1. Flight Boarded -->
                  <tr class="border-b">
                    <td class="py-2.5 font-medium">🛫 Outbound Flight Boarded</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.checklistTimeline?.flightBoardingTime || selectedTrip.milestones?.scheduledTimeline?.flightBoardingTime | date:'short') || '—' }}</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.milestones?.flightBoardedAt | date:'short') || '—' }}</td>
                    <td class="py-2.5">{{ selectedTrip.milestones?.flightBoardedVerification || '—' }}</td>
                    <td class="py-2.5 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.flightBoarded ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.flightBoarded ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <!-- 2. Flight Landed -->
                  <tr class="border-b">
                    <td class="py-2.5 font-medium">🛬 Destination Flight Landed</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.checklistTimeline?.flightLandingTime || selectedTrip.milestones?.scheduledTimeline?.flightLandingTime | date:'short') || '—' }}</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.milestones?.flightLandedAt | date:'short') || '—' }}</td>
                    <td class="py-2.5">{{ selectedTrip.milestones?.flightLandedVerification || '—' }}</td>
                    <td class="py-2.5 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.flightLanded ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.flightLanded ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <!-- 3. Cab Picked Up -->
                  <tr class="border-b">
                    <td class="py-2.5 font-medium">🚕 Cab Picked Up</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.checklistTimeline?.cabPickupTime || selectedTrip.milestones?.scheduledTimeline?.cabPickupTime | date:'short') || '—' }}</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.milestones?.cabPickedUpAt | date:'short') || '—' }}</td>
                    <td class="py-2.5">{{ selectedTrip.milestones?.cabPickedUpVerification || '—' }}</td>
                    <td class="py-2.5 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.cabPickedUp ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.cabPickedUp ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <!-- 4. Hotel Checked In -->
                  <tr class="border-b">
                    <td class="py-2.5 font-medium">🏨 Hotel Checked In</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.checklistTimeline?.hotelCheckinTime || selectedTrip.milestones?.scheduledTimeline?.hotelCheckinTime | date:'short') || '—' }}</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.milestones?.hotelCheckedInAt | date:'short') || '—' }}</td>
                    <td class="py-2.5">{{ selectedTrip.milestones?.hotelCheckedInVerification || '—' }}</td>
                    <td class="py-2.5 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.hotelCheckedIn ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.hotelCheckedIn ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <!-- 5. Hotel Checked Out -->
                  <tr class="border-b">
                    <td class="py-2.5 font-medium">🧳 Hotel Checked Out</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.checklistTimeline?.hotelCheckoutTime || selectedTrip.milestones?.scheduledTimeline?.hotelCheckoutTime | date:'short') || '—' }}</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.milestones?.hotelCheckedOutAt | date:'short') || '—' }}</td>
                    <td class="py-2.5">{{ selectedTrip.milestones?.hotelCheckedOutVerification || '—' }}</td>
                    <td class="py-2.5 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.hotelCheckedOut ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.hotelCheckedOut ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <!-- 6. Return Flight Boarded -->
                  <tr class="border-b">
                    <td class="py-2.5 font-medium" style="color: #AF52DE;">🛫 Return Flight Boarded</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.checklistTimeline?.returnFlightTime || selectedTrip.milestones?.scheduledTimeline?.returnFlightTime | date:'short') || '—' }}</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.milestones?.returnFlightBoardedAt | date:'short') || '—' }}</td>
                    <td class="py-2.5">{{ selectedTrip.milestones?.returnFlightBoardedVerification || '—' }}</td>
                    <td class="py-2.5 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.returnFlightBoarded ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.returnFlightBoarded ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <!-- 7. Journey Ended -->
                  <tr>
                    <td class="py-2.5 font-medium">🏠 Journey Completed</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.checklistTimeline?.journeyEndTime || selectedTrip.milestones?.scheduledTimeline?.journeyEndTime | date:'short') || '—' }}</td>
                    <td class="py-2.5 text-secondary">{{ (selectedTrip.milestones?.journeyEndedAt | date:'short') || '—' }}</td>
                    <td class="py-2.5">{{ selectedTrip.milestones?.journeyEndedVerification || '—' }}</td>
                    <td class="py-2.5 text-right">
                      <span class="badge" [ngClass]="selectedTrip.milestones?.journeyEnded ? 'badge-approved' : 'badge-pending'">
                        {{ selectedTrip.milestones?.journeyEnded ? '✓ Done' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 4. Associated Trip Expenses Summary -->
          <div class="section-label mb-2 font-bold text-sm" *ngIf="selectedTrip.expenses && selectedTrip.expenses.length > 0">
            🧾 Trip Expenses & Claims ({{ selectedTrip.expenses.length }} items)
          </div>
          
          <div class="detail-section p-4 rounded-xl mb-4 bg-primary border" style="border-color: var(--border-light);" *ngIf="selectedTrip.expenses && selectedTrip.expenses.length > 0">
            <div style="overflow-x: auto;">
              <table class="w-full text-xs" style="border-collapse: collapse;">
                <thead>
                  <tr class="border-b text-tertiary text-left">
                    <th class="py-2">Description</th>
                    <th class="py-2">Receipt Document</th>
                    <th class="py-2">Submitted Date</th>
                    <th class="py-2">Amount</th>
                    <th class="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let exp of selectedTrip.expenses; trackBy: trackByExpId" class="border-b">
                    <td class="py-2 font-medium">{{ exp.description || 'Travel Expense' }}</td>
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
          <button class="btn btn-secondary" (click)="showDetailsModal = false">Close</button>
          <button *ngIf="selectedTrip?.status === 'ACTIVE' || selectedTrip?.status === 'APPROVED'" class="btn btn-primary" (click)="showDetailsModal = false; viewTracking(selectedTrip!)">
            📍 Open Live Tracking
          </button>
        </div>
      </div>
    </div>

    <!-- Smooth Trip Closure Check Pop-Up Modal -->
    <div class="modal-overlay" [class.active]="showClosureModal" (click)="showClosureModal = false">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Trip #{{ closureCheck?.tripId }} Final Closure Verification</h3>
          <button class="modal-close" (click)="showClosureModal = false">✕</button>
        </div>
        <div class="modal-body" *ngIf="closureCheck">
          <p class="text-xs text-secondary mb-4">Verifying 4 strict corporate closure rules:</p>
          
          <div class="closure-rules flex flex-col gap-3">
            <div class="rule-box p-3 rounded flex items-center justify-between" [ngClass]="closureCheck.datePassed ? 'bg-success-light' : 'bg-primary'">
              <div class="flex items-center gap-2 text-xs">
                <span>📅</span> <span>Scheduled End Date ({{ closureCheck.endDate }})</span>
              </div>
              <span class="badge" [ngClass]="closureCheck.datePassed ? 'badge-approved' : 'badge-pending'">
                {{ closureCheck.datePassed ? 'Passed' : 'Pending Date' }}
              </span>
            </div>

            <div class="rule-box p-3 rounded flex items-center justify-between" [ngClass]="closureCheck.expensesCredited ? 'bg-success-light' : 'bg-primary'">
              <div class="flex items-center gap-2 text-xs">
                <span>🧾</span> <span>Expenses Settled & Credited</span>
              </div>
              <span class="badge" [ngClass]="closureCheck.expensesCredited ? 'badge-approved' : 'badge-pending'">
                {{ closureCheck.expensesCredited ? 'All Credited' : closureCheck.pendingExpensesCount + ' Pending' }}
              </span>
            </div>

            <div class="rule-box p-3 rounded flex items-center justify-between" [ngClass]="closureCheck.assetsReturned ? 'bg-success-light' : 'bg-primary'">
              <div class="flex items-center gap-2 text-xs">
                <span>🧳</span> <span>Allocated Assets Returned ({{ closureCheck.allocatedAssets }})</span>
              </div>
              <span class="badge" [ngClass]="closureCheck.assetsReturned ? 'badge-approved' : 'badge-pending'">
                {{ closureCheck.assetsReturned ? 'Returned' : 'Not Returned' }}
              </span>
            </div>

            <div class="rule-box p-3 rounded flex items-center justify-between" [ngClass]="closureCheck.journeyEnded ? 'bg-success-light' : 'bg-primary'">
              <div class="flex items-center gap-2 text-xs">
                <span>🏠</span> <span>Journey Ended Milestone</span>
              </div>
              <span class="badge" [ngClass]="closureCheck.journeyEnded ? 'badge-approved' : 'badge-pending'">
                {{ closureCheck.journeyEnded ? 'Completed' : 'Milestone Open' }}
              </span>
            </div>
          </div>

          <div *ngIf="!closureCheck.canClose" class="text-xs text-warning p-3 rounded bg-warning-light mt-4">
            Note: Standard closure requires all 4 checks. You can test complete closure using "Force Close".
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showClosureModal = false">Cancel</button>
          <button *ngIf="closureCheck?.canClose" class="btn btn-success" (click)="confirmCloseTrip(false)" [disabled]="closureLoading">
            <span class="spinner" *ngIf="closureLoading"></span> Complete & Close Trip
          </button>
          <button *ngIf="!closureCheck?.canClose" class="btn btn-primary" (click)="confirmCloseTrip(true)" [disabled]="closureLoading">
            <span class="spinner" *ngIf="closureLoading"></span> Force Close Trip
          </button>
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

    .quick-trip-item {
      background: var(--bg-surface);
      border-color: var(--border-light);
    }
    .quick-trip-item:hover {
      border-color: rgba(0, 113, 227, 0.3);
      background: rgba(0, 113, 227, 0.02);
    }
    .quick-trip-item.active-selected {
      border-color: var(--accent);
      background: rgba(0, 113, 227, 0.06);
      box-shadow: 0 2px 8px rgba(0, 113, 227, 0.12);
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .apple-date-selector-card {
      border: 1px solid var(--border-medium);
      background: rgba(0, 0, 0, 0.02);
    }
    .duration-pill {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 3px 9px;
      background: rgba(0, 113, 227, 0.12);
      color: var(--accent);
      border-radius: 9999px;
    }
    .date-pickers-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .date-picker-box {
      border: 1px solid var(--border-light);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .date-picker-box:hover, .date-picker-box:focus-within {
      border-color: rgba(0, 113, 227, 0.4);
      box-shadow: 0 4px 12px rgba(0, 113, 227, 0.08);
    }
    .form-input-apple-date {
      padding: 7px 10px;
      font-size: 0.8125rem;
      background: var(--bg-primary);
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDashboardComponent implements OnInit {
  activeView = 'profile';
  profile: UserProfile | null = null;
  trips: TripRequest[] = [];
  filteredTrips: TripRequest[] = [];
  uploadedExpenses: Expense[] = [];
  tripTabs = ['Upcoming', 'Active', 'Closed', 'Approved', 'Rejected'];
  activeTab = 'Active';

  // Raise request form
  newTrip: any = { needsFlight: false, needsHotel: false, needsCab: false };
  raiseError = '';
  raiseSuccess = '';
  raiseLoading = false;
  showDestDropdown = false;
  filteredCities: CitySuggestion[] = [];

  // Date selection state & presets
  todayStr: string = new Date().toISOString().split('T')[0];
  datePreset: '3-days' | 'next-week' | '1-week' | '2-weeks' | 'custom' = '3-days';

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

  // Details Modal
  showDetailsModal = false;
  selectedTrip: TripRequest | null = null;

  // Closure Modal
  showClosureModal = false;
  closureCheck: TripClosureCheck | null = null;
  closureLoading = false;

  constructor(
    private authService: AuthService,
    private tripService: TripService,
    private flightService: FlightService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.tripService.getMyProfile().subscribe({
      next: (p) => { this.profile = p; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.filteredCities = this.flightService.searchCities('');
    this.applyDatePreset('3-days');
    this.loadTrips();
    this.loadExpenses();
  }

  applyDatePreset(preset: '3-days' | 'next-week' | '1-week' | '2-weeks' | 'custom'): void {
    this.datePreset = preset;
    const now = new Date();

    const formatDate = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === '3-days') {
      const start = new Date(now);
      start.setDate(now.getDate() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 2);
      this.newTrip.startDate = formatDate(start);
      this.newTrip.endDate = formatDate(end);
    } else if (preset === 'next-week') {
      const start = new Date(now);
      const dayOfWeek = start.getDay();
      const daysUntilNextMon = (dayOfWeek === 0 ? 1 : 8 - dayOfWeek);
      start.setDate(now.getDate() + daysUntilNextMon);
      const end = new Date(start);
      end.setDate(start.getDate() + 4); // Mon to Fri
      this.newTrip.startDate = formatDate(start);
      this.newTrip.endDate = formatDate(end);
    } else if (preset === '1-week') {
      const start = new Date(now);
      start.setDate(now.getDate() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      this.newTrip.startDate = formatDate(start);
      this.newTrip.endDate = formatDate(end);
    } else if (preset === '2-weeks') {
      const start = new Date(now);
      start.setDate(now.getDate() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 13);
      this.newTrip.startDate = formatDate(start);
      this.newTrip.endDate = formatDate(end);
    }
  }

  getFormattedDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  getTripDurationText(): string {
    if (!this.newTrip.startDate || !this.newTrip.endDate) return '';
    const start = new Date(this.newTrip.startDate);
    const end = new Date(this.newTrip.endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 'Invalid Range';
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const nights = Math.max(0, diffDays - 1);
    if (diffDays === 1) return '⚡ 1 Day (Same-Day Return)';
    return `⏱️ ${diffDays} Days · ${nights} Nights`;
  }

  isDateInvalid(): boolean {
    if (!this.newTrip.startDate || !this.newTrip.endDate) return false;
    return this.newTrip.endDate < this.newTrip.startDate;
  }

  onStartDateChange(): void {
    this.datePreset = 'custom';
    if (this.newTrip.endDate && this.newTrip.endDate < this.newTrip.startDate) {
      this.newTrip.endDate = this.newTrip.startDate;
    }
  }

  onEndDateChange(): void {
    this.datePreset = 'custom';
  }

  onDestInput(): void {
    this.filteredCities = this.flightService.searchCities(this.newTrip.destination || '');
    this.showDestDropdown = true;
  }

  selectCity(city: CitySuggestion): void {
    this.newTrip.destination = `${city.name}, ${city.country}`;
    this.showDestDropdown = false;
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
        this.updateFilteredTrips();
        this.cdr.markForCheck();
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

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.updateFilteredTrips();
  }

  private updateFilteredTrips(): void {
    const statusMap: Record<string, string[]> = {
      'Upcoming': ['PENDING_AUTO_VAL', 'PENDING_MANAGER'],
      'Active': ['ACTIVE'],
      'Closed': ['CLOSED'],
      'Approved': ['APPROVED'],
      'Rejected': ['REJECTED', 'REJECTED_SYSTEM'],
    };
    const statuses = statusMap[this.activeTab] || [];
    this.filteredTrips = this.trips.filter(t => statuses.includes(t.status || ''));
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

  selectTrackingTrip(tripId?: number | null): void {
    if (!tripId) return;
    this.activeTripId = tripId;
    this.trackingTripId = tripId;
    this.cdr.markForCheck();
  }

  viewTracking(trip: TripRequest): void {
    if (trip && trip.id) {
      this.activeTripId = trip.id;
      this.trackingTripId = trip.id;
    }
    this.activeView = 'tracking';
    this.cdr.markForCheck();
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

  openTripDetails(trip: TripRequest): void {
    this.selectedTrip = trip;
    this.showDetailsModal = true;
    if (trip.id) {
      this.tripService.getTripById(trip.id).subscribe({
        next: (full) => this.selectedTrip = full,
        error: () => {}
      });
    }
  }

  openClosureModal(trip: TripRequest): void {
    if (!trip.id) return;
    this.selectedTrip = trip;
    this.closureCheck = null;
    this.showClosureModal = true;
    this.tripService.checkTripClosure(trip.id).subscribe({
      next: (check) => this.closureCheck = check,
      error: (err) => this.showAlert('Error', err.error?.message || 'Failed to fetch closure verification status.')
    });
  }

  confirmCloseTrip(force: boolean): void {
    if (!this.selectedTrip?.id) return;
    this.closureLoading = true;
    const tripId = this.selectedTrip.id;

    this.tripService.closeTrip(tripId, force).subscribe({
      next: () => {
        this.closureLoading = false;
        this.showClosureModal = false;
        this.showAlert('Trip Closed', `Trip #${tripId} has been successfully closed!`);
        this.loadTrips();
      },
      error: (err) => {
        this.closureLoading = false;
        this.showAlert('Closure Error', err.error?.message || 'Unable to close trip.');
      }
    });
  }

  showAlert(title: string, message: string): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
    this.cdr.markForCheck();
  }

  // trackBy functions for efficient DOM recycling
  trackByTripId(index: number, trip: TripRequest): number { return trip.id || index; }
  trackByExpId(index: number, item: any): number { return item.id || index; }
  trackByTab(index: number, tab: string): string { return tab; }
  trackByCityName(index: number, city: CitySuggestion): string { return city.name; }

  logout(): void {
    this.authService.logout();
  }
}
