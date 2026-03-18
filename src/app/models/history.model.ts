export interface HistoricalSet {
  reps: number;
  weight: number;
}

export interface HistoricalExercise {
  exerciseId: string;
  exerciseName: string;
  sets: HistoricalSet[];
}

export interface WorkoutHistoryEntry {
  id: string;
  workoutId: string;
  workoutName: string;
  completedAt: number;
  exercises: HistoricalExercise[];
}
