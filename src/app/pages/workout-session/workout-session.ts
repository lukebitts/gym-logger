import {
  Component, inject, signal, computed, OnInit, OnDestroy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../services/session.service';
import { HistoryService } from '../../services/history.service';
import { WorkoutService } from '../../services/workout.service';
import { ActiveSession, LoggedSet } from '../../models/session.model';
import { HistoricalSet } from '../../models/history.model';

interface SetDraft {
  reps: number;
  weight: number;
}

@Component({
  selector: 'app-workout-session',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './workout-session.html',
})
export class WorkoutSessionComponent implements OnInit, OnDestroy {
  private sessionService = inject(SessionService);
  private historyService = inject(HistoryService);
  private workoutService = inject(WorkoutService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  session = this.sessionService.session;

  // Per-exercise drafts for the next set to log (exerciseId -> draft)
  drafts = signal<Record<string, SetDraft>>({});

  // Timer state
  timerSeconds = signal(0);
  timerRunning = signal(false);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  showCancelConfirm = signal(false);
  showSaveConfirm = signal(false);

  ngOnInit(): void {
    const workoutId = this.route.snapshot.paramMap.get('workoutId');
    const s = this.session();

    // If no active session or session is for a different workout, start fresh
    if (!s || s.workoutId !== workoutId) {
      const workout = workoutId ? this.workoutService.getById(workoutId) : null;
      if (!workout) {
        this.router.navigate(['/']);
        return;
      }
      this.sessionService.startSession(workout);
    }

    // Initialize timer from saved state
    const restored = this.session();
    if (restored) {
      this.timerSeconds.set(restored.timerSeconds);
    }

    // Initialize drafts from session exercises
    const currentSession = this.session();
    if (currentSession) {
      const initialDrafts: Record<string, SetDraft> = {};
      for (const ex of currentSession.exercises) {
        initialDrafts[ex.exerciseId] = {
          reps: ex.targetReps,
          weight: ex.targetWeight,
        };
      }
      this.drafts.set(initialDrafts);
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // --- Timer ---

  startTimer(): void {
    if (this.timerRunning()) return;
    this.timerRunning.set(true);
    this.timerInterval = setInterval(() => {
      const next = this.timerSeconds() + 1;
      this.timerSeconds.set(next);
      this.sessionService.updateTimerSeconds(next);
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerRunning.set(false);
    this.timerSeconds.set(0);
    this.sessionService.updateTimerSeconds(0);
  }

  formatTimer(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // --- Drafts ---

  getDraft(exerciseId: string): SetDraft {
    return this.drafts()[exerciseId] ?? { reps: 10, weight: 0 };
  }

  updateDraftReps(exerciseId: string, reps: number): void {
    this.drafts.update(d => ({ ...d, [exerciseId]: { ...this.getDraft(exerciseId), reps } }));
  }

  updateDraftWeight(exerciseId: string, weight: number): void {
    this.drafts.update(d => ({ ...d, [exerciseId]: { ...this.getDraft(exerciseId), weight } }));
  }

  // --- Set logging ---

  addSet(exerciseId: string): void {
    const draft = this.getDraft(exerciseId);
    if (draft.reps <= 0) return;
    this.sessionService.addSet(exerciseId, { reps: draft.reps, weight: draft.weight });
  }

  removeSet(exerciseId: string, index: number): void {
    this.sessionService.removeSet(exerciseId, index);
  }

  // --- History helpers ---

  getPersonalRecord(exerciseId: string): HistoricalSet | null {
    return this.historyService.getPersonalRecord(exerciseId);
  }

  getLastTime(exerciseId: string): { completedAt: number; sets: HistoricalSet[] } | null {
    return this.historyService.getLastTime(exerciseId);
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  // --- Save / Cancel ---

  confirmSave(): void {
    this.showSaveConfirm.set(true);
  }

  executeSave(): void {
    const s = this.session();
    if (s) {
      this.historyService.saveSession(s);
      this.sessionService.clearSession();
    }
    this.stopTimer();
    this.router.navigate(['/']);
  }

  confirmCancel(): void {
    this.showCancelConfirm.set(true);
  }

  executeCancel(): void {
    this.sessionService.clearSession();
    this.stopTimer();
    this.router.navigate(['/']);
  }

  dismissDialogs(): void {
    this.showCancelConfirm.set(false);
    this.showSaveConfirm.set(false);
  }

  totalSetsLogged(): number {
    const s = this.session();
    if (!s) return 0;
    return s.exercises.reduce((sum, e) => sum + e.loggedSets.length, 0);
  }
}
