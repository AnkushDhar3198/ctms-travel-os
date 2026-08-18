import { Component, Input, OnInit } from '@angular/core';
import { TripService } from '../../../core/services/trip.service';
import { TripMilestone } from '../../../core/models/models';

interface TimelineStep {
  key: string;
  label: string;
  icon: string;
  description: string;
  completed: boolean;
  loading: boolean;
}

@Component({
  selector: 'app-trip-timeline',
  template: `
    <div class="timeline-container card animate-fade-in">
      <div class="timeline-header">
        <h3>Live Trip Timeline</h3>
        <p class="text-secondary">Track your journey progress</p>
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
          <div class="step-node" (click)="toggleMilestone(step)">
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
          </div>

          <!-- Action button -->
          <div class="step-action">
            <button
              *ngIf="!step.completed"
              class="btn btn-sm"
              [class.btn-primary]="isCurrentStep(i)"
              [class.btn-secondary]="!isCurrentStep(i)"
              [disabled]="step.loading || !canComplete(i)"
              (click)="toggleMilestone(step)"
            >
              {{ step.loading ? 'Updating...' : 'Mark Complete' }}
            </button>
            <span *ngIf="step.completed" class="completed-badge">
              ✓ Completed
            </span>
          </div>
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
  `]
})
export class TripTimelineComponent implements OnInit {
  @Input() tripId!: number;

  steps: TimelineStep[] = [
    { key: 'flight_boarded', label: 'Flight Boarded', icon: '✈️', description: 'Board your outbound flight', completed: false, loading: false },
    { key: 'flight_landed', label: 'Flight Landed', icon: '🛬', description: 'Arrive at destination', completed: false, loading: false },
    { key: 'cab_picked_up', label: 'Cab Pickup', icon: '🚕', description: 'Cab picked you up from airport', completed: false, loading: false },
    { key: 'hotel_checked_in', label: 'Hotel Check-In', icon: '🏨', description: 'Check in at your hotel', completed: false, loading: false },
    { key: 'hotel_checked_out', label: 'Hotel Check-Out', icon: '🧳', description: 'Check out from hotel', completed: false, loading: false },
    { key: 'return_flight_boarded', label: 'Return Flight', icon: '🛫', description: 'Board your return flight', completed: false, loading: false },
    { key: 'journey_ended', label: 'Journey Ended', icon: '🏠', description: 'Arrive back safely', completed: false, loading: false },
  ];

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

  toggleMilestone(step: TimelineStep): void {
    if (step.completed || step.loading) return;

    const stepIndex = this.steps.indexOf(step);
    if (!this.canComplete(stepIndex)) return;

    // Optimistic UI: show loading
    step.loading = true;

    this.tripService.updateMilestone(this.tripId, {
      milestoneName: step.key,
      value: true
    }).subscribe({
      next: (milestones) => {
        step.loading = false;
        this.applyMilestones(milestones);
      },
      error: () => {
        step.loading = false;
        // Revert on failure
        step.completed = false;
      }
    });
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

  private applyMilestones(milestones: TripMilestone): void {
    const map: Record<string, boolean> = {
      flight_boarded: milestones.flightBoarded,
      flight_landed: milestones.flightLanded,
      cab_picked_up: milestones.cabPickedUp,
      hotel_checked_in: milestones.hotelCheckedIn,
      hotel_checked_out: milestones.hotelCheckedOut,
      return_flight_boarded: milestones.returnFlightBoarded,
      journey_ended: milestones.journeyEnded,
    };

    this.steps.forEach(step => {
      step.completed = map[step.key] || false;
    });
  }
}
