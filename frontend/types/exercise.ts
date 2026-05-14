export interface Exercise {
  id: number;
  title: string;
  description: string;
  starter_code: string;
  expected_output: string;
}

export type ExerciseList = Exercise[];
