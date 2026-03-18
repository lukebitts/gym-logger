import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then(m => m.HomeComponent),
  },
  {
    path: 'workout/new',
    loadComponent: () =>
      import('./pages/workout-form/workout-form').then(m => m.WorkoutFormComponent),
  },
  {
    path: 'workout/edit/:id',
    loadComponent: () =>
      import('./pages/workout-form/workout-form').then(m => m.WorkoutFormComponent),
  },
  {
    path: 'session/:workoutId',
    loadComponent: () =>
      import('./pages/workout-session/workout-session').then(m => m.WorkoutSessionComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
