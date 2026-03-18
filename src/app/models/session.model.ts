export interface LoggedSet {
  reps: number;
  weight: number;
}

export interface ActiveExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  loggedSets: LoggedSet[];
}

export interface ActiveSession {
  workoutId: string;
  workoutName: string;
  startedAt: number;
  exercises: ActiveExercise[];
  timerSeconds: number;
}
