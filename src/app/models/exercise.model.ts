export interface Exercise {
  exerciseId: string;
  name: string;
  imageUrl: string;
  bodyParts: string[];
  equipments: string[];
  exerciseType: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  keywords: string[];
}

export interface ExerciseApiMeta {
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor: string | null;
}

export interface ExerciseApiResponse {
  success: boolean;
  meta: ExerciseApiMeta;
  data: Exercise[];
}
