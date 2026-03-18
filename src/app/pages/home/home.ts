import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { WorkoutService } from '../../services/workout.service';
import { SessionService } from '../../services/session.service';
import { WorkoutTemplate } from '../../models/workout.model';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
})
export class HomeComponent {
  private workoutService = inject(WorkoutService);
  private sessionService = inject(SessionService);
  private router = inject(Router);

  workouts = this.workoutService.workouts;
  expandedId = signal<string | null>(null);
  deleteTargetId = signal<string | null>(null);

  activeSession = this.sessionService.session;

  getMuscles(workout: WorkoutTemplate): string {
    const muscles = new Set<string>();
    for (const ex of workout.exercises) {
      for (const m of ex.targetMuscles) muscles.add(m);
      if (ex.bodyPart) muscles.add(ex.bodyPart);
    }
    return Array.from(muscles).slice(0, 5).join(', ') || 'No exercises';
  }

  toggleExpand(id: string): void {
    this.expandedId.update(cur => (cur === id ? null : id));
  }

  startWorkout(workout: WorkoutTemplate): void {
    this.sessionService.startSession(workout);
    this.router.navigate(['/session', workout.id]);
  }

  resumeSession(): void {
    const s = this.activeSession();
    if (s) this.router.navigate(['/session', s.workoutId]);
  }

  editWorkout(id: string): void {
    this.router.navigate(['/workout/edit', id]);
  }

  confirmDelete(id: string): void {
    this.deleteTargetId.set(id);
  }

  cancelDelete(): void {
    this.deleteTargetId.set(null);
  }

  executeDelete(): void {
    const id = this.deleteTargetId();
    if (id) {
      this.workoutService.delete(id);
      this.expandedId.set(null);
      this.deleteTargetId.set(null);
    }
  }

  addWorkout(): void {
    this.router.navigate(['/workout/new']);
  }
}
