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
                <tr *ngFor="let user of users">
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
                <tr *ngFor="let trip of getFilteredTrips()">
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
              <div class="feature-item"><span class="feature-dot pending"></span> Auto-escalation to manager</div>
            </div>
          </div>
        </div>

        <!-- ==================== Analytics ==================== -->
        <div *ngIf="view === 'analytics'" class="animate-fade-in">
          <div class="page-header flex justify-between items-center">
            <div>
              <h2>System Analytics</h2>
              <p class="text-secondary">Key metrics and insights</p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="view = 'overview'">← Back</button>
          </div>

          <div class="analytics-grid stagger-children">
            <!-- Summary Cards -->
            <div class="card metric-card p-6">
              <p class="metric-label">Total Users</p>
              <h2 class="metric-value">{{ userCount }}</h2>
              <div class="metric-breakdown">
                <span class="badge badge-active">{{ countRole('EMPLOYEE') }} Employees</span>
                <span class="badge badge-pending">{{ countRole('MANAGER') }} Managers</span>
              </div>
            </div>
            <div class="card metric-card p-6">
              <p class="metric-label">Total Trips</p>
              <h2 class="metric-value">{{ tripCount }}</h2>
              <div class="metric-breakdown">
                <span class="badge badge-active">{{ countByStatus('ACTIVE') }} Active</span>
                <span class="badge badge-approved">{{ countByStatus('CLOSED') }} Closed</span>
              </div>
            </div>
            <div class="card metric-card p-6">
              <p class="metric-label">Pending Approvals</p>
              <h2 class="metric-value">{{ countPending() }}</h2>
              <div class="metric-breakdown">
                <span class="badge badge-pending">Awaiting review</span>
              </div>
            </div>
            <div class="card metric-card p-6">
              <p class="metric-label">Rejected</p>
              <h2 class="metric-value">{{ countRejected() }}</h2>
              <div class="metric-breakdown">
                <span class="badge badge-rejected">{{ countByStatus('REJECTED') }} Manager</span>
                <span class="badge badge-rejected">{{ countByStatus('REJECTED_SYSTEM') }} System</span>
              </div>
            </div>

            <!-- Status Breakdown Bar -->
            <div class="card p-6 chart-card">
              <h4 class="mb-4">Trip Status Breakdown</h4>
              <div class="status-bars">
                <div class="bar-row" *ngFor="let s of statusBreakdown">
                  <span class="bar-label">{{ s.label }}</span>
                  <div class="bar-track">
                    <div class="bar-fill" [ngClass]="s.colorClass" [style.width.%]="getBarWidth(s.count)"></div>
                  </div>
                  <span class="bar-count">{{ s.count }}</span>
                </div>
              </div>
            </div>

            <!-- Department Breakdown -->
            <div class="card p-6 chart-card">
              <h4 class="mb-4">Users by Department</h4>
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
