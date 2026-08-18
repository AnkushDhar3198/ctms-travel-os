import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-employee-login',
  template: `
    <div class="fullscreen-center">
      <div class="login-container animate-scale-in">
        <button class="btn btn-ghost btn-sm mb-4" (click)="goBack()">← Back</button>

        <div class="card p-8">
          <div class="form-header text-center mb-6">
            <div class="form-icon text-accent mb-3" style="font-size: 2.5rem;">👤</div>
            <h2>Employee Login</h2>
            <p class="text-secondary mt-1">Sign in with your credentials</p>
          </div>

          <div class="form-body">
            <div class="form-group">
              <label class="form-label">Employee ID</label>
              <input
                class="form-input"
                type="text"
                placeholder="e.g. EMP001"
                [(ngModel)]="empId"
                (keyup.enter)="login()"
                [class.error]="error"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input
                class="form-input"
                type="password"
                placeholder="Enter your password"
                [(ngModel)]="password"
                (keyup.enter)="login()"
                [class.error]="error"
              />
            </div>

            <div class="error-message" *ngIf="error">
              {{ error }}
            </div>

            <button
              class="btn btn-primary btn-lg w-full mt-2"
              (click)="login()"
              [disabled]="loading"
            >
              <span class="spinner" *ngIf="loading"></span>
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }

    .error-message {
      color: var(--danger);
      font-size: 0.8125rem;
      text-align: center;
      margin-bottom: 16px;
      padding: 10px 16px;
      background: var(--danger-light);
      border-radius: var(--radius-md);
    }
  `]
})
export class EmployeeLoginComponent {
  empId = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    if (!this.empId || !this.password) {
      this.error = 'Please enter both Employee ID and Password.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.employeeLogin(this.empId, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/employee']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }

  goBack() {
    this.router.navigate(['/auth']);
  }
}
