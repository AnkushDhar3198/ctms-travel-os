import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { TripService } from '../../../core/services/trip.service';
import { TripMilestone } from '../../../core/models/models';

interface TimelineStep {
  key: string;
  label: string;
  icon: string;
  description: string;
  completed: boolean;
  loading: boolean;
  verificationPrompt: string;
  verification?: string;
  completedAt?: string;
  scheduledTime?: string;
  quickSuggestions: string[];
}

@Component({
  selector: 'app-trip-timeline',
  template: `
    <div class="timeline-container card animate-fade-in">
      <!-- Timeline Header -->
      <div class="timeline-header flex justify-between items-start flex-wrap gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h3>Live Trip Timeline</h3>
            <span class="trip-id-pill">Trip #{{ tripId }}</span>
          </div>
          <p class="text-secondary text-xs mt-1">Track and verify your journey progress with real-time milestone check-ins</p>
        </div>

        <button class="btn btn-secondary btn-sm flex items-center gap-1" (click)="loadMilestones()" [disabled]="refreshing">
          <span class="refresh-icon" [class.spinning]="refreshing">↻</span>
          <span>{{ refreshing ? 'Updating...' : 'Refresh Status' }}</span>
        </button>
      </div>

      <!-- Progress Section -->
      <div class="progress-section">
        <div class="flex justify-between items-center text-xs mb-2">
          <span class="font-semibold text-secondary">Journey Completion</span>
          <span class="font-bold text-accent">{{ getCompletedCount() }} of {{ steps.length }} milestones ({{ getProgress() | number:'1.0-0' }}%)</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" [style.width.%]="getProgress()"></div>
        </div>
      </div>

      <!-- Timeline Steps List -->
      <div class="timeline">
        <div
          *ngFor="let step of steps; let i = index; let last = last"
          class="timeline-step"
          [class.completed]="step.completed"
          [class.active]="isCurrentStep(i)"
        >
          <!-- Connector line -->
          <div class="step-connector" *ngIf="!last">
            <div class="connector-fill" [class.filled]="step.completed"></div>
          </div>

          <!-- Step node -->
          <div class="step-node" (click)="initiateComplete(step)">
            <!-- Loading state -->
            <div class="node-spinner" *ngIf="step.loading">
              <span class="spinner"></span>
            </div>

            <!-- Completed state (animated checkmark) -->
            <div class="node-check" *ngIf="step.completed && !step.loading">
              <div class="checkmark-circle">
                <svg viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>

            <!-- Uncompleted state -->
            <div class="node-empty" *ngIf="!step.completed && !step.loading">
              <span class="node-icon">{{ step.icon }}</span>
            </div>
          </div>

          <!-- Step content -->
          <div class="step-content">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 [class.text-success]="step.completed">{{ step.label }}</h4>
              <span *ngIf="isCurrentStep(i) && !step.completed" class="badge badge-active text-2xs animate-pulse">Next Action</span>
            </div>
            <p class="text-secondary text-xs">{{ step.description }}</p>

            <!-- Scheduled time -->
            <div class="scheduled-time" *ngIf="step.scheduledTime">
              <span class="schedule-icon">🕐</span>
              <span class="schedule-text">Scheduled: {{ formatDateTime(step.scheduledTime) }}</span>
              <span *ngIf="step.completed" class="time-status" [ngClass]="getTimeStatus(step)">
                {{ getTimeStatusLabel(step) }}
              </span>
            </div>

            <!-- Completion details (shown when completed) -->
            <div class="completion-details" *ngIf="step.completed && step.verification">
              <span class="verification-badge">🔒 {{ step.verification }}</span>
              <span class="completed-time" *ngIf="step.completedAt">at {{ formatDateTime(step.completedAt) }}</span>
            </div>
          </div>

          <!-- Action button -->
          <div class="step-action">
            <button
              *ngIf="!step.completed"
              class="btn btn-sm"
              [class.btn-primary]="isCurrentStep(i)"
              [class.btn-secondary]="!isCurrentStep(i)"
              [disabled]="step.loading"
              (click)="initiateComplete(step)"
            >
              <span *ngIf="step.loading" class="spinner mr-1"></span>
              {{ step.loading ? 'Verifying...' : '🔐 Verify' }}
            </button>
            <span *ngIf="step.completed" class="completed-badge">
              ✓ Verified
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Verification Modal -->
    <div class="modal-overlay" [class.active]="showVerificationModal" (click)="cancelVerification()">
      <div class="modal-container verification-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="flex items-center gap-2">
            <span class="modal-icon-badge">🔐</span>
            <h3 class="modal-title">Milestone Verification</h3>
          </div>
          <button class="modal-close" (click)="cancelVerification()" [disabled]="submitting">✕</button>
        </div>

        <div class="modal-body" *ngIf="verifyingStep">
          <div class="verify-milestone-info">
            <span class="verify-icon">{{ verifyingStep.icon }}</span>
            <div>
              <h4>{{ verifyingStep.label }}</h4>
              <p class="text-secondary text-xs" *ngIf="verifyingStep.scheduledTime">
                Scheduled: <strong>{{ formatDateTime(verifyingStep.scheduledTime) }}</strong>
              </p>
              <p class="text-secondary text-xs" *ngIf="!verifyingStep.scheduledTime">
                {{ verifyingStep.description }}
              </p>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label font-semibold">{{ verifyingStep.verificationPrompt }} *</label>
            <input
              class="form-input text-base"
              [(ngModel)]="verificationInput"
              [placeholder]="getPlaceholder(verifyingStep)"
              (keydown.enter)="submitVerification()"
              [disabled]="submitting"
              autofocus
            />
            <p class="form-hint text-secondary">Please enter your verification details or select a quick option below.</p>
          </div>

          <!-- Quick suggestion chips -->
          <div class="quick-chips-wrapper mt-3">
            <span class="text-xs text-tertiary block mb-2 font-medium">Quick suggestions:</span>
            <div class="flex gap-2 flex-wrap">
              <button
                *ngFor="let suggestion of verifyingStep.quickSuggestions"
                type="button"
                class="quick-chip"
                (click)="verificationInput = suggestion"
                [disabled]="submitting"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <!-- Verification Error Alert -->
          <div *ngIf="verificationError" class="verification-error animate-fade-in mt-4">
            <div class="flex items-center gap-2">
              <span class="text-danger font-bold">⚠️</span>
              <span>{{ verificationError }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer flex justify-end gap-2">
          <button class="btn btn-secondary" (click)="cancelVerification()" [disabled]="submitting">Cancel</button>
          <button class="btn btn-primary flex items-center gap-2" (click)="submitVerification()" [disabled]="!verificationInput?.trim() || submitting">
            <span class="spinner" *ngIf="submitting"></span>
            <span>{{ submitting ? 'Verifying...' : '✓ Confirm & Complete' }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .timeline-container {
      padding: 28px;
    }

    .timeline-header {
      margin-bottom: 24px;
    }

    .timeline-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .trip-id-pill {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(0, 113, 227, 0.1);
      color: var(--accent);
    }

    .refresh-icon {
      font-size: 1rem;
      display: inline-block;
      transition: transform 0.3s;
    }
    .refresh-icon.spinning {
      animation: spin 0.8s linear infinite;
    }

    .progress-section {
      margin-bottom: 28px;
      background: var(--bg-primary);
      padding: 14px 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-light);
    }

    .progress-bar-track {
      height: 7px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--accent-gradient);
      border-radius: 4px;
      transition: width 0.6s var(--ease-apple);
    }

    /* Timeline layout */
    .timeline {
      position: relative;
    }

    .timeline-step {
      display: flex;
      align-items: flex-start;
      gap: 18px;
      padding: 14px 12px;
      position: relative;
      border-radius: var(--radius-md);
      transition: background 0.2s ease;
    }

    .timeline-step:hover {
      background: rgba(0, 113, 227, 0.02);
    }

    .timeline-step.active {
      background: rgba(0, 113, 227, 0.04);
    }

    /* Connector line */
    .step-connector {
      position: absolute;
      left: 32px;
      top: 56px;
      width: 2px;
      height: calc(100% - 24px);
      background: var(--border-light);
      z-index: 0;
    }

    .connector-fill {
      width: 100%;
      height: 0%;
      background: var(--success);
      transition: height 0.5s var(--ease-apple);
    }

    .connector-fill.filled {
      height: 100%;
    }

    /* Step node */
    .step-node {
      width: 42px;
      height: 42px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s ease;
      z-index: 1;
    }

    .step-node:hover {
      transform: scale(1.08);
    }

    .node-empty {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 2px solid var(--border-medium);
      background: white;
      display: grid;
      place-items: center;
      font-size: 1.15rem;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    .timeline-step.active .node-empty {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.15);
    }

    .node-spinner {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
    }

    .node-check {
      animation: checkPop 0.4s var(--ease-apple);
    }

    /* Step content */
    .step-content {
      flex: 1;
      padding-top: 4px;
    }

    .step-content h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      margin-bottom: 2px;
      transition: color 0.2s;
    }

    /* Scheduled time display */
    .scheduled-time {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
      padding: 4px 10px;
      background: rgba(0, 113, 227, 0.06);
      border-radius: 8px;
      width: fit-content;
    }

    .schedule-icon {
      font-size: 0.75rem;
    }

    .schedule-text {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--accent);
    }

    .time-status {
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      margin-left: 4px;
    }

    .time-status.on-time {
      background: rgba(48, 209, 88, 0.12);
      color: #1A9E38;
    }

    .time-status.delayed {
      background: rgba(255, 59, 48, 0.12);
      color: #FF3B30;
    }

    .time-status.early {
      background: rgba(0, 113, 227, 0.12);
      color: #0071E3;
    }

    /* Completion details */
    .completion-details {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    .verification-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: #1A9E38;
      background: rgba(48, 209, 88, 0.1);
      padding: 3px 10px;
      border-radius: 6px;
      border: 1px solid rgba(48, 209, 88, 0.2);
    }

    .completed-time {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    /* Action */
    .step-action {
      padding-top: 6px;
      flex-shrink: 0;
    }

    .completed-badge {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--success);
      padding: 4px 10px;
      background: rgba(48, 209, 88, 0.08);
      border-radius: 8px;
    }

    /* Completed step styling */
    .timeline-step.completed .step-content h4 {
      color: var(--text-secondary);
    }

    /* Verification Modal */
    .verification-modal {
      max-width: 480px;
    }

    .modal-icon-badge {
      font-size: 1.25rem;
    }

    .verify-milestone-info {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
      background: var(--bg-primary);
      border-radius: 12px;
      border: 1px solid var(--border-light);
      margin-bottom: 20px;
    }

    .verify-icon {
      font-size: 2rem;
    }

    .verify-milestone-info h4 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 2px;
    }

    .quick-chip {
      padding: 5px 12px;
      border-radius: 8px;
      background: var(--bg-primary);
      border: 1px solid var(--border-medium);
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .quick-chip:hover:not(:disabled) {
      background: var(--accent-light);
      border-color: var(--accent);
      color: var(--accent);
    }

    .form-hint {
      font-size: 0.75rem;
      margin-top: 6px;
    }

    .verification-error {
      padding: 10px 14px;
      background: rgba(255, 59, 48, 0.08);
      border: 1px solid rgba(255, 59, 48, 0.25);
      border-radius: 8px;
      color: var(--danger);
      font-size: 0.8125rem;
    }

    .animate-pulse {
      animation: pulseGlow 1.8s infinite;
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripTimelineComponent implements OnInit, OnChanges {
  @Input() tripId!: number;

  steps: TimelineStep[] = [
    {
      key: 'flight_boarded',
      label: 'Flight Boarded',
      icon: '✈️',
      description: 'Board your outbound flight',
      completed: false,
      loading: false,
      verificationPrompt: 'Enter your seat number or gate',
      quickSuggestions: ['14A', '12F', '7B', 'Gate 4']
    },
    {
      key: 'flight_landed',
      label: 'Flight Landed',
      icon: '🛬',
      description: 'Arrive safely at destination airport',
      completed: false,
      loading: false,
      verificationPrompt: 'Enter arrival terminal or carousel',
      quickSuggestions: ['Terminal 2', 'Terminal 1', 'Belt 4', 'Landed Safely']
    },
    {
      key: 'cab_picked_up',
      label: 'Cab Pickup',
      icon: '🚕',
      description: 'Cab picked you up from airport/station',
      completed: false,
      loading: false,
      verificationPrompt: 'Enter cab OTP or driver confirmation code',
      quickSuggestions: ['4829', '7104', '8921', 'Driver Met']
    },
    {
      key: 'hotel_checked_in',
      label: 'Hotel Check-In',
      icon: '🏨',
      description: 'Check in at your reserved hotel',
      completed: false,
      loading: false,
      verificationPrompt: 'Enter hotel booking ID or room number',
      quickSuggestions: ['HBK-90234', 'CONF-8192', 'Room 304', 'Checked In']
    },
    {
      key: 'hotel_checked_out',
      label: 'Hotel Check-Out',
      icon: '🧳',
      description: 'Check out from hotel after stay',
      completed: false,
      loading: false,
      verificationPrompt: 'Enter checkout folio/receipt number',
      quickSuggestions: ['REC-4521', 'Folio-883', 'Cleared', 'Bill Settled']
    },
    {
      key: 'return_flight_boarded',
      label: 'Return Flight Boarded',
      icon: '🛫',
      description: 'Board your return flight home',
      completed: false,
      loading: false,
      verificationPrompt: 'Enter return flight seat number',
      quickSuggestions: ['22C', '18D', '11A', 'Gate 2']
    },
    {
      key: 'journey_ended',
      label: 'Journey Ended',
      icon: '🏠',
      description: 'Arrive back safely at home/office',
      completed: false,
      loading: false,
      verificationPrompt: 'Enter journey end confirmation',
      quickSuggestions: ['Reached Home Safely', 'Trip Completed', 'Home Arrival Confirmed']
    },
  ];

  // Verification modal state
  showVerificationModal = false;
  verifyingStep: TimelineStep | null = null;
  verificationInput = '';
  verificationError = '';
  submitting = false;
  refreshing = false;

  constructor(
    private tripService: TripService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.tripId) {
      this.loadMilestones();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tripId'] && changes['tripId'].currentValue) {
      this.loadMilestones();
    }
  }

  loadMilestones(): void {
    if (!this.tripId) return;
    this.refreshing = true;
    this.cdr.markForCheck();

    this.tripService.getMilestones(this.tripId).subscribe({
      next: (milestones) => {
        this.refreshing = false;
        this.applyMilestones(milestones);
        this.cdr.markForCheck();
      },
      error: () => {
        this.refreshing = false;
        this.cdr.markForCheck();
      }
    });
  }

  initiateComplete(step: TimelineStep): void {
    if (step.completed || step.loading || this.submitting) return;

    this.verifyingStep = step;
    this.verificationInput = '';
    this.verificationError = '';
    this.submitting = false;
    this.showVerificationModal = true;
    this.cdr.markForCheck();
  }

  submitVerification(): void {
    if (!this.verifyingStep || this.submitting) return;

    const text = this.verificationInput?.trim();
    if (!text) {
      this.verificationError = 'Please enter verification details to proceed.';
      this.cdr.markForCheck();
      return;
    }

    this.verificationError = '';
    this.submitting = true;
    const step = this.verifyingStep;
    step.loading = true;
    this.cdr.markForCheck();

    this.tripService.updateMilestone(this.tripId, {
      milestoneName: step.key,
      value: true,
      verificationText: text
    }).subscribe({
      next: (milestones) => {
        this.submitting = false;
        step.loading = false;
        this.showVerificationModal = false;
        this.verifyingStep = null;
        this.applyMilestones(milestones);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting = false;
        step.loading = false;
        this.verificationError = err.error?.message || 'Verification failed. Please verify the trip is active and try again.';
        this.cdr.markForCheck();
      }
    });
  }

  cancelVerification(): void {
    if (this.submitting) return;
    this.showVerificationModal = false;
    this.verifyingStep = null;
    this.verificationInput = '';
    this.verificationError = '';
    this.cdr.markForCheck();
  }

  isCurrentStep(index: number): boolean {
    if (this.steps[index].completed) return false;
    for (let i = 0; i < index; i++) {
      if (!this.steps[i].completed) return false;
    }
    return true;
  }

  getProgress(): number {
    const completed = this.getCompletedCount();
    return (completed / this.steps.length) * 100;
  }

  getCompletedCount(): number {
    return this.steps.filter(s => s.completed).length;
  }

  formatDateTime(isoString: string): string {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  }

  getTimeStatus(step: TimelineStep): string {
    if (!step.scheduledTime || !step.completedAt) return '';
    const scheduled = new Date(step.scheduledTime).getTime();
    const actual = new Date(step.completedAt).getTime();
    const diffMinutes = (actual - scheduled) / (1000 * 60);
    if (diffMinutes > 30) return 'delayed';
    if (diffMinutes < -30) return 'early';
    return 'on-time';
  }

  getTimeStatusLabel(step: TimelineStep): string {
    const status = this.getTimeStatus(step);
    switch (status) {
      case 'on-time': return '✓ On Time';
      case 'delayed': return '⚠ Delayed';
      case 'early': return '↑ Early';
      default: return '';
    }
  }

  getPlaceholder(step: TimelineStep): string {
    const placeholders: Record<string, string> = {
      flight_boarded: 'e.g. 14A',
      flight_landed: 'e.g. Terminal 2',
      cab_picked_up: 'e.g. 4829',
      hotel_checked_in: 'e.g. HBK-90234',
      hotel_checked_out: 'e.g. REC-4521',
      return_flight_boarded: 'e.g. 22C',
      journey_ended: 'e.g. Reached safely',
    };
    return placeholders[step.key] || 'Enter verification details';
  }

  private applyMilestones(milestones: TripMilestone): void {
    const completionMap: Record<string, boolean> = {
      flight_boarded: milestones.flightBoarded,
      flight_landed: milestones.flightLanded,
      cab_picked_up: milestones.cabPickedUp,
      hotel_checked_in: milestones.hotelCheckedIn,
      hotel_checked_out: milestones.hotelCheckedOut,
      return_flight_boarded: milestones.returnFlightBoarded,
      journey_ended: milestones.journeyEnded,
    };

    const verificationMap: Record<string, string | undefined> = {
      flight_boarded: milestones.flightBoardedVerification,
      flight_landed: milestones.flightLandedVerification,
      cab_picked_up: milestones.cabPickedUpVerification,
      hotel_checked_in: milestones.hotelCheckedInVerification,
      hotel_checked_out: milestones.hotelCheckedOutVerification,
      return_flight_boarded: milestones.returnFlightBoardedVerification,
      journey_ended: milestones.journeyEndedVerification,
    };

    const timestampMap: Record<string, string | undefined> = {
      flight_boarded: milestones.flightBoardedAt,
      flight_landed: milestones.flightLandedAt,
      cab_picked_up: milestones.cabPickedUpAt,
      hotel_checked_in: milestones.hotelCheckedInAt,
      hotel_checked_out: milestones.hotelCheckedOutAt,
      return_flight_boarded: milestones.returnFlightBoardedAt,
      journey_ended: milestones.journeyEndedAt,
    };

    // Apply scheduled timeline
    const timeline = milestones.scheduledTimeline;
    const scheduleMap: Record<string, string | undefined> = timeline ? {
      flight_boarded: timeline.flightBoardingTime,
      flight_landed: timeline.flightLandingTime,
      cab_picked_up: timeline.cabPickupTime,
      hotel_checked_in: timeline.hotelCheckinTime,
      hotel_checked_out: timeline.hotelCheckoutTime,
      return_flight_boarded: timeline.returnFlightTime,
      journey_ended: timeline.journeyEndTime,
    } : {};

    this.steps.forEach(step => {
      step.completed = completionMap[step.key] || false;
      step.verification = verificationMap[step.key];
      step.completedAt = timestampMap[step.key];
      step.scheduledTime = scheduleMap[step.key];
      step.loading = false;
    });
  }
}
