export interface WorkoutExerciseConfig {
  exerciseId: string;
  exerciseName: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyPart: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: WorkoutExerciseConfig[];
  createdAt: number;
  updatedAt: number;
}
