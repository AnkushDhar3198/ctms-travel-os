import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface RoleCard {
  role: string;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-elevated-login',
  template: `
    <div class="fullscreen-center">
      <div class="elevated-content animate-fade-in">
        <button class="btn btn-ghost btn-sm mb-6" (click)="goBack()">← Back</button>

        <div class="header-section text-center mb-8">
          <h1>Elevated Access</h1>
          <p class="text-secondary mt-2">Select your role to continue</p>
        </div>

        <div class="role-cards stagger-children">
          <div
            *ngFor="let card of roleCards"
            class="card role-card"
            (click)="selectRole(card)"
            [class.selected]="selectedRole?.role === card.role"
          >
            <div class="role-icon mb-3 text-accent">{{ card.icon }}</div>
            <h3 class="mb-2">{{ card.label }}</h3>
            <p class="text-secondary text-sm">{{ card.description }}</p>
          </div>
        </div>
      </div>

      <!-- Passcode Modal -->
      <div
        class="modal-overlay"
        [class.active]="showPasscodeModal"
        (click)="closeModal($event)"
      >
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Enter Passcode</h3>
            <button class="modal-close" (click)="showPasscodeModal = false">✕</button>
          </div>

          <div class="modal-body">
            <div class="selected-role-badge mb-6 p-4 rounded-md flex items-center gap-3">
              <span class="role-badge-icon text-2xl">{{ selectedRole?.icon }}</span>
              <span class="font-medium text-accent">{{ selectedRole?.label }}</span>
            </div>

            <div class="form-group text-center">
              <label class="form-label mb-3">6-Digit Passcode</label>
              <div class="passcode-input-group flex justify-center gap-2">
                <input
                  *ngFor="let i of [0,1,2,3,4,5]"
                  class="passcode-digit"
                  type="password"
                  maxlength="1"
                  [(ngModel)]="passcodeDigits[i]"
                  (input)="onDigitInput($event, i)"
                  (keydown)="onDigitKeydown($event, i)"
                  (paste)="onPaste($event)"
                  #digitInput
                />
              </div>
            </div>

            <div class="error-message mt-4" *ngIf="error">
              {{ error }}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showPasscodeModal = false">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitPasscode()"
              [disabled]="loading || getPasscode().length < 6"
            >
              <span class="spinner" *ngIf="loading"></span>
              {{ loading ? 'Verifying...' : 'Verify & Sign In' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .elevated-content {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 900px;
      padding: 40px 20px;
    }

    .header-section h1 {
      font-size: 2.25rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .role-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .role-card {
      padding: 32px 24px;
      text-align: center;
      transition: var(--transition-normal);
      cursor: pointer;
    }

    .role-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: rgba(0, 113, 227, 0.2);
    }

    .role-card.selected {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1), var(--shadow-md);
    }

    .role-icon {
      font-size: 2.5rem;
    }
    
    .text-sm {
      font-size: 0.8125rem;
    }

    /* Passcode modal */
    .selected-role-badge {
      background: var(--accent-light);
    }

    .passcode-digit {
      width: 48px;
      height: 56px;
      text-align: center;
      font-size: 1.5rem;
      font-weight: 600;
      font-family: inherit;
      border: 2px solid var(--border-medium);
      border-radius: var(--radius-md);
      background: var(--bg-secondary);
      outline: none;
      transition: var(--transition-fast);
      color: var(--text-primary);
    }

    .passcode-digit:focus {
      border-color: var(--accent);
      background: white;
      box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
    }

    .error-message {
      color: var(--danger);
      font-size: 0.8125rem;
      text-align: center;
      padding: 10px 16px;
      background: var(--danger-light);
      border-radius: var(--radius-md);
    }
  `]
})
export class ElevatedLoginComponent {
  roleCards: RoleCard[] = [
    { role: 'MANAGER', label: 'Manager', icon: '📊', description: 'Review & approve travel requests' },
    { role: 'TRAVEL_DESK', label: 'Travel Desk', icon: '🗺️', description: 'Book travel & manage itineraries' },
    { role: 'FINANCE', label: 'Finance', icon: '💰', description: 'Process expenses & reimbursements' },
    { role: 'ADMIN', label: 'Admin', icon: '⚙️', description: 'System administration & controls' },
  ];

  selectedRole: RoleCard | null = null;
  showPasscodeModal = false;
  passcodeDigits: string[] = ['', '', '', '', '', ''];
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  selectRole(card: RoleCard) {
    this.selectedRole = card;
    this.passcodeDigits = ['', '', '', '', '', ''];
    this.error = '';
    this.showPasscodeModal = true;

    // Focus first digit after modal renders
    setTimeout(() => {
      const firstInput = document.querySelector('.passcode-digit') as HTMLInputElement;
      firstInput?.focus();
    }, 100);
  }

  onDigitInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.value && index < 5) {
      const nextInput = input.nextElementSibling as HTMLInputElement;
      nextInput?.focus();
    }
    // Auto-submit when all digits entered
    if (this.getPasscode().length === 6) {
      this.submitPasscode();
    }
  }

  onDigitKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.passcodeDigits[index] && index > 0) {
      const prevInput = (event.target as HTMLElement).previousElementSibling as HTMLInputElement;
      prevInput?.focus();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    digits.forEach((d, i) => this.passcodeDigits[i] = d);
    if (digits.length === 6) {
      this.submitPasscode();
    }
  }

  getPasscode(): string {
    return this.passcodeDigits.join('');
  }

  submitPasscode() {
    if (!this.selectedRole || this.getPasscode().length < 6) return;

    this.loading = true;
    this.error = '';

    this.authService.passcodeLogin(this.selectedRole.role, this.getPasscode()).subscribe({
      next: (res) => {
        this.loading = false;
        this.showPasscodeModal = false;
        // Route based on role
        const routeMap: Record<string, string> = {
          'MANAGER': '/manager',
          'TRAVEL_DESK': '/travel-desk',
          'FINANCE': '/finance',
          'ADMIN': '/admin'
        };
        this.router.navigate([routeMap[res.role] || '/auth']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Invalid passcode. Please try again.';
        this.passcodeDigits = ['', '', '', '', '', ''];
        setTimeout(() => {
          const firstInput = document.querySelector('.passcode-digit') as HTMLInputElement;
          firstInput?.focus();
        }, 100);
      }
    });
  }

  closeModal(event: Event) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showPasscodeModal = false;
    }
  }

  goBack() {
    this.router.navigate(['/auth']);
  }
}
