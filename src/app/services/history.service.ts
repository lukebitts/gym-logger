import { Injectable, signal } from '@angular/core';
import { WorkoutHistoryEntry, HistoricalSet } from '../models/history.model';
import { ActiveSession } from '../models/session.model';

const STORAGE_KEY = 'gym_history';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private _history = signal<WorkoutHistoryEntry[]>(this.load());

  readonly history = this._history.asReadonly();

  private load(): WorkoutHistoryEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private save(entries: WorkoutHistoryEntry[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    this._history.set(entries);
  }

  saveSession(session: ActiveSession): WorkoutHistoryEntry {
    const entry: WorkoutHistoryEntry = {
      id: crypto.randomUUID(),
      workoutId: session.workoutId,
      workoutName: session.workoutName,
      completedAt: Date.now(),
      exercises: session.exercises.map(e => ({
        exerciseId: e.exerciseId,
        exerciseName: e.exerciseName,
        sets: e.loggedSets.map(s => ({ reps: s.reps, weight: s.weight })),
      })),
    };
    this.save([...this._history(), entry]);
    return entry;
  }

  /** Returns the best set ever for an exercise (highest weight * reps score). */
  getPersonalRecord(exerciseId: string): HistoricalSet | null {
    let best: HistoricalSet | null = null;
    let bestScore = 0;

    for (const entry of this._history()) {
      for (const ex of entry.exercises) {
        if (ex.exerciseId !== exerciseId) continue;
        for (const set of ex.sets) {
          const score = set.weight * set.reps;
          if (score > bestScore) {
            bestScore = score;
            best = set;
          }
        }
      }
    }
    return best;
  }

  /** Returns sets from the most recent session that included this exercise. */
  getLastTime(exerciseId: string): { completedAt: number; sets: HistoricalSet[] } | null {
    const sorted = [...this._history()].sort((a, b) => b.completedAt - a.completedAt);
    for (const entry of sorted) {
      const ex = entry.exercises.find(e => e.exerciseId === exerciseId);
      if (ex && ex.sets.length > 0) {
        return { completedAt: entry.completedAt, sets: ex.sets };
      }
    }
    return null;
  }
}
