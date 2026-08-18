import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  template: `
    <div class="landing-page">
      <div class="landing-content animate-fade-in">
        <div class="brand-section">
          <div class="brand-logo">✈</div>
          <h1>TravelOS</h1>
          <p class="brand-tagline">Corporate Travel Management</p>
        </div>

        <div class="login-grid stagger-children">
          <div class="login-option" (click)="goToEmployeeLogin()">
            <div class="option-icon">👤</div>
            <div class="option-body">
              <h3>Employee Login</h3>
              <p>Sign in with Employee ID</p>
            </div>
            <span class="option-arrow">→</span>
          </div>

          <div class="login-option" (click)="goToElevatedLogin()">
            <div class="option-icon">🔐</div>
            <div class="option-body">
              <h3>Elevated Access</h3>
              <p>Manager, Travel Desk, Finance & Admin</p>
            </div>
            <span class="option-arrow">→</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary);
    }
    .landing-content { text-align: center; width: 100%; max-width: 480px; padding: 40px 24px; }
    .brand-section { margin-bottom: 48px; }
    .brand-logo {
      font-size: 3rem; margin-bottom: 16px;
      filter: drop-shadow(0 4px 12px rgba(0, 113, 227, 0.15));
    }
    .brand-section h1 {
      font-size: 2.25rem; font-weight: 800; letter-spacing: -0.04em;
      color: var(--text-primary);
    }
    .brand-tagline {
      font-size: 0.9375rem; color: var(--text-secondary);
      margin-top: 4px; font-weight: 400;
    }
    .login-grid { display: flex; flex-direction: column; gap: 12px; }
    .login-option {
      display: flex; align-items: center; gap: 16px;
      padding: 20px 24px; background: var(--bg-surface);
      border: 1px solid var(--border-light); border-radius: var(--radius-lg);
      cursor: pointer; transition: var(--transition-fast);
      text-align: left; box-shadow: var(--shadow-sm);
    }
    .login-option:hover {
      border-color: rgba(0, 113, 227, 0.2); box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
    .option-icon {
      font-size: 1.75rem; width: 48px; height: 48px;
      display: grid; place-items: center; background: var(--bg-primary);
      border-radius: var(--radius-md); flex-shrink: 0;
    }
    .option-body { flex: 1; }
    .option-body h3 { font-size: 0.9375rem; font-weight: 600; margin-bottom: 2px; }
    .option-body p { font-size: 0.8125rem; color: var(--text-secondary); }
    .option-arrow {
      font-size: 1.125rem; color: var(--text-tertiary);
      transition: var(--transition-fast);
    }
    .login-option:hover .option-arrow { color: var(--accent); transform: translateX(3px); }
  `]
})
export class LandingComponent {
  constructor(private router: Router) {}
  goToEmployeeLogin() { this.router.navigate(['/auth/employee-login']); }
  goToElevatedLogin() { this.router.navigate(['/auth/elevated-login']); }
}
