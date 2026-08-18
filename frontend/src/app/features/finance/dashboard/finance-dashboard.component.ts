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
                  <td><strong>#EXP-{{ exp.id }}</strong></td>
                  <td>#{{ exp.tripId }}</td>
                  <td>{{ exp.description || '—' }}</td>
                  <td><strong class="text-accent">₹{{ exp.amount }}</strong></td>
                  <td>{{ exp.fileName || 'receipt.pdf' }}</td>
                  <td><span class="badge" [ngClass]="exp.status === 'PENDING' ? 'badge-pending' : 'badge-credited'">{{ exp.status }}</span></td>
                  <td>
                    <button
                      *ngIf="exp.status === 'PENDING'"
                      class="btn btn-sm btn-success"
                      (click)="openCreditModal(exp)"
                    >
                      💰 Credit Expense
                    </button>
                    <span *ngIf="exp.status === 'CREDITED'" class="text-success font-semibold text-xs">✓ Credited to Salary</span>
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

    <!-- Smooth Credit Confirmation Popup Modal -->
    <div class="modal-overlay" [class.active]="showCreditModal" (click)="showCreditModal = false">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Confirm Reimbursement</h3>
          <button class="modal-close" (click)="showCreditModal = false">✕</button>
        </div>
        <div class="modal-body" *ngIf="selectedExpense">
          <div class="p-4 rounded bg-primary mb-4 text-center">
            <span class="text-xs text-secondary block mb-1">REIMBURSEMENT AMOUNT</span>
            <h2 class="text-2xl font-bold text-success">₹{{ selectedExpense.amount }}</h2>
          </div>
          <div class="details-list">
            <div class="detail-row"><span class="detail-label">Claim ID</span><strong>#EXP-{{ selectedExpense.id }}</strong></div>
            <div class="detail-row"><span class="detail-label">Linked Trip ID</span><strong>#{{ selectedExpense.tripId }}</strong></div>
            <div class="detail-row"><span class="detail-label">Description</span><strong>{{ selectedExpense.description || 'General Expense' }}</strong></div>
            <div class="detail-row"><span class="detail-label">Settlement Mode</span><strong class="text-accent">Employee Salary Credit</strong></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showCreditModal = false">Cancel</button>
          <button class="btn btn-success" (click)="confirmCredit()" [disabled]="creditingLoading">
            <span class="spinner" *ngIf="creditingLoading"></span>
            {{ creditingLoading ? 'Processing...' : 'Confirm & Process Credit' }}
          </button>
        </div>
      </div>
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
  selectedExpense: Expense | null = null;
  showCreditModal = false;
  creditingLoading = false;

  constructor(public authService: AuthService, private tripService: TripService) {}

  ngOnInit(): void { this.loadPending(); }

  loadPending(): void {
    this.tripService.getPendingExpenses().subscribe({
      next: (e) => this.expenses = e,
      error: () => this.expenses = []
    });
  }

  openCreditModal(exp: Expense): void {
    this.selectedExpense = exp;
    this.showCreditModal = true;
  }

  confirmCredit(): void {
    if (!this.selectedExpense || !this.selectedExpense.id) return;
    this.creditingLoading = true;
    this.tripService.creditExpense(this.selectedExpense.id).subscribe({
      next: () => {
        this.creditingLoading = false;
        this.showCreditModal = false;
        this.selectedExpense = null;
        this.loadPending();
      },
      error: () => { this.creditingLoading = false; }
    });
  }
}
