import {
  Component, inject, signal, output, OnDestroy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { ExerciseApiService } from '../../services/exercise-api.service';
import { Exercise } from '../../models/exercise.model';

@Component({
  selector: 'app-exercise-picker',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './exercise-picker.html',
})
export class ExercisePickerComponent implements OnDestroy {
  private apiService = inject(ExerciseApiService);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  exerciseSelected = output<Exercise>();
  closed = output<void>();

  query = signal('');
  results = signal<Exercise[]>([]);
  loading = signal(false);
  error = signal(false);
  total = signal(0);
  hasNextPage = signal(false);
  private nextCursor: string | null = null;
  private currentQuery = '';

  constructor() {
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap(q => {
          this.loading.set(true);
          this.error.set(false);
          this.currentQuery = q;
          this.nextCursor = null;
          return this.apiService.searchByName(q, 20);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: res => {
          this.results.set(res.data ?? []);
          this.total.set(res.meta?.total ?? 0);
          this.hasNextPage.set(res.meta?.hasNextPage ?? false);
          this.nextCursor = res.meta?.nextCursor ?? null;
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    if (value.trim().length >= 2) {
      this.search$.next(value.trim());
    } else {
      this.results.set([]);
      this.total.set(0);
      this.hasNextPage.set(false);
    }
  }

  loadMore(): void {
    if (!this.nextCursor) return;
    this.loading.set(true);
    this.apiService
      .searchByName(this.currentQuery, 20, this.nextCursor)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.results.update(prev => [...prev, ...(res.data ?? [])]);
          this.hasNextPage.set(res.meta?.hasNextPage ?? false);
          this.nextCursor = res.meta?.nextCursor ?? null;
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  select(exercise: Exercise): void {
    this.exerciseSelected.emit(exercise);
  }

  close(): void {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
