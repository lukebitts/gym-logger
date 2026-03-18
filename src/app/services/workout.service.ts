import { Injectable, signal, computed } from '@angular/core';
import { WorkoutTemplate } from '../models/workout.model';

const STORAGE_KEY = 'gym_workouts';

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private _workouts = signal<WorkoutTemplate[]>(this.load());

  readonly workouts = this._workouts.asReadonly();

  private load(): WorkoutTemplate[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private save(workouts: WorkoutTemplate[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
    this._workouts.set(workouts);
  }

  getById(id: string): WorkoutTemplate | undefined {
    return this._workouts().find(w => w.id === id);
  }

  add(workout: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>): WorkoutTemplate {
    const newWorkout: WorkoutTemplate = {
      ...workout,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.save([...this._workouts(), newWorkout]);
    return newWorkout;
  }

  update(id: string, changes: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>): void {
    const updated = this._workouts().map(w =>
      w.id === id ? { ...w, ...changes, updatedAt: Date.now() } : w
    );
    this.save(updated);
  }

  delete(id: string): void {
    this.save(this._workouts().filter(w => w.id !== id));
  }
}
