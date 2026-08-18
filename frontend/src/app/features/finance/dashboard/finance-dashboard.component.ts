import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TripService } from '../../../core/services/trip.service';
import { Expense } from '../../../core/models/models';

@Component({
  selector: 'app-finance-dashboard',
  template: `
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">✈</div>
          <span class="sidebar-brand-text">TravelOS</span>
        </div>
        <nav class="sidebar-nav">
          <button class="sidebar-link" [class.active]="view === 'pending'" (click)="view = 'pending'; loadPending()">
            <span class="sidebar-link-icon">⏳</span> Pending Expenses
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
          <h2>Expense Management</h2>
          <p class="text-secondary">Finance Dashboard</p>
        </div>

        <div class="animate-fade-in">
          <div class="card" style="overflow-x: auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Trip ID</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>File</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let exp of expenses">
                  <td>{{ exp.id }}</td>
                  <td>{{ exp.tripId }}</td>
                  <td>{{ exp.description || '—' }}</td>
                  <td><strong>₹{{ exp.amount }}</strong></td>
                  <td>{{ exp.fileName || '—' }}</td>
                  <td><span class="badge" [ngClass]="exp.status === 'PENDING' ? 'badge-pending' : 'badge-credited'">{{ exp.status }}</span></td>
                  <td>
                    <button
                      *ngIf="exp.status === 'PENDING'"
                      class="btn btn-sm btn-success"
                      (click)="creditExpense(exp)"
                      [disabled]="exp.id === creditingId"
                    >
                      {{ exp.id === creditingId ? 'Processing...' : '💰 Credit' }}
                    </button>
                    <span *ngIf="exp.status === 'CREDITED'" class="text-success">✓ Done</span>
                  </td>
                </tr>
                <tr *ngIf="expenses.length === 0">
                  <td colspan="7" class="text-center text-secondary p-8">No pending expenses.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-layout { display: flex; min-height: 100vh; background: var(--bg-primary); }
    .page-header { margin-bottom: 32px; }
    .page-header h2 { font-size: 1.75rem; }
  `]
})
export class FinanceDashboardComponent implements OnInit {
  view = 'pending';
  expenses: Expense[] = [];
  creditingId: number | null = null;

  constructor(public authService: AuthService, private tripService: TripService) {}

  ngOnInit(): void { this.loadPending(); }

  loadPending(): void {
    this.tripService.getPendingExpenses().subscribe({
      next: (e) => this.expenses = e,
      error: () => this.expenses = []
    });
  }

  creditExpense(exp: Expense): void {
    if (!exp.id) return;
    this.creditingId = exp.id;
    this.tripService.creditExpense(exp.id).subscribe({
      next: () => {
        this.creditingId = null;
        this.loadPending();
      },
      error: () => { this.creditingId = null; }
    });
  }
}
