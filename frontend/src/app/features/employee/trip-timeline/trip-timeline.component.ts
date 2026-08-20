import { Component, Input, OnInit } from '@angular/core';
import { TripService } from '../../../core/services/trip.service';
import { TripMilestone, ChecklistTimeline } from '../../../core/models/models';

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
}

@Component({
  selector: 'app-trip-timeline',
  template: `
    <div class="timeline-container card animate-fade-in">
      <div class="timeline-header">
        <h3>Live Trip Timeline</h3>
        <p class="text-secondary">Track your journey progress with scheduled milestones</p>
        <div class="progress-bar-track">
          <div
            class="progress-bar-fill"
            [style.width.%]="getProgress()"
          ></div>
        </div>
        <span class="progress-label">{{ getCompletedCount() }} of {{ steps.length }} completed</span>
      </div>

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
          <div class="step-node" (click)="initiateComplete(step, i)">
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
            <h4 [class.text-success]="step.completed">{{ step.label }}</h4>
            <p>{{ step.description }}</p>
            <!-- Scheduled time -->
            <div class="scheduled-time" *ngIf="step.scheduledTime">
              <span class="schedule-icon">🕐</span>
              <span class="schedule-text">Expected: {{ formatDateTime(step.scheduledTime) }}</span>
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
              [disabled]="step.loading || !canComplete(i)"
              (click)="initiateComplete(step, i)"
            >
              {{ step.loading ? 'Verifying...' : '🔐 Verify & Complete' }}
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
          <h3 class="modal-title">🔐 Milestone Verification</h3>
          <button class="modal-close" (click)="cancelVerification()">✕</button>
        </div>
        <div class="modal-body" *ngIf="verifyingStep">
          <div class="verify-milestone-info">
            <span class="verify-icon">{{ verifyingStep.icon }}</span>
            <div>
              <h4>{{ verifyingStep.label }}</h4>
              <p class="text-secondary" *ngIf="verifyingStep.scheduledTime">
                Scheduled: {{ formatDateTime(verifyingStep.scheduledTime) }}
              </p>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">{{ verifyingStep.verificationPrompt }}</label>
            <input
              class="form-input"
              [(ngModel)]="verificationInput"
              [placeholder]="getPlaceholder(verifyingStep)"
              (keydown.enter)="submitVerification()"
              autofocus
            />
            <p class="form-hint text-secondary">This verification is mandatory to confirm the milestone.</p>
          </div>
          <div *ngIf="verificationError" class="verification-error">
            {{ verificationError }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="cancelVerification()">Cancel</button>
          <button class="btn btn-primary" (click)="submitVerification()" [disabled]="!verificationInput?.trim()">
            ✓ Verify & Complete
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .timeline-container {
      padding: 32px;
    }

    .timeline-header {
      margin-bottom: 32px;
    }

    .timeline-header h3 {
      font-size: 1.25rem;
      margin-bottom: 4px;
    }

    .progress-bar-track {
      height: 6px;
      background: var(--bg-secondary);
      border-radius: 3px;
      margin-top: 16px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--accent-gradient);
      border-radius: 3px;
      transition: width 0.6s var(--ease-apple);
    }

    .progress-label {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      margin-top: 8px;
      display: block;
    }

    /* Timeline layout */
    .timeline {
      position: relative;
    }

    .timeline-step {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      padding: 16px 0;
      position: relative;
      transition: var(--transition-normal);
    }

    .timeline-step:hover {
      background: rgba(0, 0, 0, 0.01);
      border-radius: var(--radius-md);
    }

    /* Connector line */
    .step-connector {
      position: absolute;
      left: 22px;
      top: 60px;
      width: 2px;
      height: calc(100% - 28px);
      background: var(--border-light);
    }

    .connector-fill {
      width: 100%;
      height: 0%;
      background: var(--success);
      transition: height 0.6s var(--ease-apple);
    }

    .connector-fill.filled {
      height: 100%;
    }

    /* Step node */
    .step-node {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition-fast);
      z-index: 1;
    }

    .step-node:hover {
      transform: scale(1.1);
    }

    .node-empty {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 2px solid var(--border-medium);
      background: white;
      display: grid;
      place-items: center;
      font-size: 1.25rem;
      transition: var(--transition-fast);
    }

    .timeline-step.active .node-empty {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px var(--accent-light);
    }

    .node-spinner {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
    }

    .node-check {
      animation: checkPop 0.4s var(--ease-apple);
    }

    /* Step content */
    .step-content {
      flex: 1;
      padding-top: 8px;
    }

    .step-content h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      margin-bottom: 2px;
      transition: var(--transition-fast);
    }

    .step-content p {
      font-size: 0.8125rem;
      color: var(--text-secondary);
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
      color: #30D158;
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
      margin-top: 4px;
      flex-wrap: wrap;
    }

    .verification-badge {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
      background: rgba(48, 209, 88, 0.08);
      padding: 2px 10px;
      border-radius: 6px;
    }

    .completed-time {
      font-size: 0.6875rem;
      color: var(--text-tertiary);
    }

    /* Action */
    .step-action {
      padding-top: 8px;
      flex-shrink: 0;
    }

    .completed-badge {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--success);
    }

    /* Completed step styling */
    .timeline-step.completed .step-content h4 {
      color: var(--text-tertiary);
      text-decoration: line-through;
      text-decoration-color: rgba(0, 0, 0, 0.2);
    }

    /* Verification Modal */
    .verification-modal {
      max-width: 460px;
    }

    .verify-milestone-info {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .verify-icon {
      font-size: 2rem;
    }

    .verify-milestone-info h4 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .form-hint {
      font-size: 0.75rem;
      margin-top: 6px;
    }

    .verification-error {
      margin-top: 12px;
      padding: 10px 14px;
      background: rgba(255, 59, 48, 0.08);
      border: 1px solid rgba(255, 59, 48, 0.2);
      border-radius: 8px;
      color: var(--danger);
      font-size: 0.8125rem;
    }
  `]
})
export class TripTimelineComponent implements OnInit {
  @Input() tripId!: number;

  steps: TimelineStep[] = [
    { key: 'flight_boarded', label: 'Flight Boarded', icon: '✈️', description: 'Board your outbound flight', completed: false, loading: false, verificationPrompt: 'Enter your seat number' },
    { key: 'flight_landed', label: 'Flight Landed', icon: '🛬', description: 'Arrive at destination', completed: false, loading: false, verificationPrompt: 'Enter flight arrival terminal' },
    { key: 'cab_picked_up', label: 'Cab Pickup', icon: '🚕', description: 'Cab picked you up from airport', completed: false, loading: false, verificationPrompt: 'Enter cab OTP or driver code' },
    { key: 'hotel_checked_in', label: 'Hotel Check-In', icon: '🏨', description: 'Check in at your hotel', completed: false, loading: false, verificationPrompt: 'Enter hotel booking confirmation ID' },
    { key: 'hotel_checked_out', label: 'Hotel Check-Out', icon: '🧳', description: 'Check out from hotel', completed: false, loading: false, verificationPrompt: 'Enter checkout receipt number' },
    { key: 'return_flight_boarded', label: 'Return Flight', icon: '🛫', description: 'Board your return flight', completed: false, loading: false, verificationPrompt: 'Enter return flight seat number' },
    { key: 'journey_ended', label: 'Journey Ended', icon: '🏠', description: 'Arrive back safely', completed: false, loading: false, verificationPrompt: 'Enter home arrival confirmation' },
  ];

  // Verification modal state
  showVerificationModal = false;
  verifyingStep: TimelineStep | null = null;
  verificationInput = '';
  verificationError = '';

  constructor(private tripService: TripService) {}

  ngOnInit(): void {
    if (this.tripId) {
      this.loadMilestones();
    }
  }

  loadMilestones(): void {
    this.tripService.getMilestones(this.tripId).subscribe({
      next: (milestones) => this.applyMilestones(milestones),
      error: () => {} // Silently handle — milestones may not exist yet
    });
  }

  initiateComplete(step: TimelineStep, index: number): void {
    if (step.completed || step.loading) return;
    if (!this.canComplete(index)) return;

    // Open verification modal
    this.verifyingStep = step;
    this.verificationInput = '';
    this.verificationError = '';
    this.showVerificationModal = true;
  }

  submitVerification(): void {
    if (!this.verifyingStep) return;

    const text = this.verificationInput?.trim();
    if (!text) {
      this.verificationError = 'Please enter the verification details to proceed.';
      return;
    }

    this.verificationError = '';
    this.showVerificationModal = false;
    const step = this.verifyingStep;
    this.verifyingStep = null;

    // Show loading state
    step.loading = true;

    this.tripService.updateMilestone(this.tripId, {
      milestoneName: step.key,
      value: true,
      verificationText: text
    }).subscribe({
      next: (milestones) => {
        step.loading = false;
        this.applyMilestones(milestones);
      },
      error: (err) => {
        step.loading = false;
        step.completed = false;
        this.verificationError = err.error?.message || 'Verification failed. Please try again.';
      }
    });
  }

  cancelVerification(): void {
    this.showVerificationModal = false;
    this.verifyingStep = null;
    this.verificationInput = '';
    this.verificationError = '';
  }

  canComplete(index: number): boolean {
    // Must complete steps in order
    if (index === 0) return true;
    return this.steps[index - 1].completed;
  }

  isCurrentStep(index: number): boolean {
    if (this.steps[index].completed) return false;
    if (index === 0) return !this.steps[0].completed;
    return this.steps[index - 1].completed && !this.steps[index].completed;
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
      flight_boarded: '14A',
      flight_landed: 'Terminal 2',
      cab_picked_up: '4829',
      hotel_checked_in: 'HBK-90234',
      hotel_checked_out: 'REC-4521',
      return_flight_boarded: '22C',
      journey_ended: 'Reached safely',
    };
    return placeholders[step.key] || 'Enter verification';
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
    });
  }
}
