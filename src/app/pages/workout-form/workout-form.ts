import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkoutService } from '../../services/workout.service';
import { WorkoutExerciseConfig } from '../../models/workout.model';
import { Exercise } from '../../models/exercise.model';
import { ExercisePickerComponent } from '../../components/exercise-picker/exercise-picker';

@Component({
  selector: 'app-workout-form',
  standalone: true,
  imports: [FormsModule, ExercisePickerComponent],
  templateUrl: './workout-form.html',
})
export class WorkoutFormComponent implements OnInit {
  private workoutService = inject(WorkoutService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editId = signal<string | null>(null);
  workoutName = signal('');
  exercises = signal<WorkoutExerciseConfig[]>([]);
  showPicker = signal(false);
  editExerciseIndex = signal<number | null>(null);
  showCancelConfirm = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const existing = this.workoutService.getById(id);
      if (existing) {
        this.editId.set(id);
        this.workoutName.set(existing.name);
        this.exercises.set(existing.exercises.map(e => ({ ...e })));
      }
    }
  }

  openPicker(): void {
    this.editExerciseIndex.set(null);
    this.showPicker.set(true);
  }

  closePicker(): void {
    this.showPicker.set(false);
    this.editExerciseIndex.set(null);
  }

  onExerciseSelected(exercise: Exercise): void {
    const config: WorkoutExerciseConfig = {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      gifUrl: exercise.imageUrl ?? '',
      targetMuscles: exercise.targetMuscles ?? [],
      bodyPart: exercise.bodyParts?.[0] ?? '',
      targetSets: 3,
      targetReps: 10,
      targetWeight: 0,
    };

    // Check if exercise already in list
    const existing = this.exercises().findIndex(e => e.exerciseId === exercise.exerciseId);
    if (existing >= 0) {
      this.showPicker.set(false);
      return;
    }

    this.exercises.update(exs => [...exs, config]);
    this.showPicker.set(false);
  }

  updateExercise(index: number, field: keyof WorkoutExerciseConfig, value: number): void {
    this.exercises.update(exs => {
      const copy = [...exs];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  removeExercise(index: number): void {
    this.exercises.update(exs => exs.filter((_, i) => i !== index));
  }

  moveUp(index: number): void {
    if (index === 0) return;
    this.exercises.update(exs => {
      const copy = [...exs];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      return copy;
    });
  }

  moveDown(index: number): void {
    this.exercises.update(exs => {
      if (index >= exs.length - 1) return exs;
      const copy = [...exs];
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
      return copy;
    });
  }

  save(): void {
    const name = this.workoutName().trim();
    if (!name) return;

    const payload = { name, exercises: this.exercises() };
    const id = this.editId();

    if (id) {
      this.workoutService.update(id, payload);
    } else {
      this.workoutService.add(payload);
    }
    this.router.navigate(['/']);
  }

  cancel(): void {
    const hasData = this.workoutName().trim().length > 0 || this.exercises().length > 0;
    if (hasData) {
      this.showCancelConfirm.set(true);
    } else {
      this.router.navigate(['/']);
    }
  }

  confirmCancelDismiss(): void {
    this.showCancelConfirm.set(false);
  }

  confirmCancelExecute(): void {
    this.router.navigate(['/']);
  }

  isValid(): boolean {
    return this.workoutName().trim().length > 0;
  }
}
