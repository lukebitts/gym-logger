import { Injectable, signal } from '@angular/core';
import { ActiveSession, ActiveExercise, LoggedSet } from '../models/session.model';
import { WorkoutTemplate } from '../models/workout.model';

const STORAGE_KEY = 'gym_active_session';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private _session = signal<ActiveSession | null>(this.load());

  readonly session = this._session.asReadonly();

  private load(): ActiveSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private persist(): void {
    const s = this._session();
    if (s) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  startSession(workout: WorkoutTemplate): void {
    const session: ActiveSession = {
      workoutId: workout.id,
      workoutName: workout.name,
      startedAt: Date.now(),
      timerSeconds: 0,
      exercises: workout.exercises.map(e => ({
        exerciseId: e.exerciseId,
        exerciseName: e.exerciseName,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        targetWeight: e.targetWeight,
        loggedSets: [],
      })),
    };
    this._session.set(session);
    this.persist();
  }

  addSet(exerciseId: string, set: LoggedSet): void {
    const s = this._session();
    if (!s) return;
    const updated: ActiveSession = {
      ...s,
      exercises: s.exercises.map(e =>
        e.exerciseId === exerciseId
          ? { ...e, loggedSets: [...e.loggedSets, set] }
          : e
      ),
    };
    this._session.set(updated);
    this.persist();
  }

  updateSet(exerciseId: string, setIndex: number, set: LoggedSet): void {
    const s = this._session();
    if (!s) return;
    const updated: ActiveSession = {
      ...s,
      exercises: s.exercises.map(e => {
        if (e.exerciseId !== exerciseId) return e;
        const sets = [...e.loggedSets];
        sets[setIndex] = set;
        return { ...e, loggedSets: sets };
      }),
    };
    this._session.set(updated);
    this.persist();
  }

  removeSet(exerciseId: string, setIndex: number): void {
    const s = this._session();
    if (!s) return;
    const updated: ActiveSession = {
      ...s,
      exercises: s.exercises.map(e => {
        if (e.exerciseId !== exerciseId) return e;
        const sets = e.loggedSets.filter((_, i) => i !== setIndex);
        return { ...e, loggedSets: sets };
      }),
    };
    this._session.set(updated);
    this.persist();
  }

  updateTimerSeconds(seconds: number): void {
    const s = this._session();
    if (!s) return;
    this._session.set({ ...s, timerSeconds: seconds });
    this.persist();
  }

  clearSession(): void {
    this._session.set(null);
    this.persist();
  }
}
