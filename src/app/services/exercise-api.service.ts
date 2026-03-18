import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Exercise, ExerciseApiResponse } from '../models/exercise.model';

const BASE_URL = 'https://exercisedbv2.ascendapi.com/api/v1';

const EMPTY_RESPONSE: ExerciseApiResponse = {
  success: false,
  meta: { total: 0, hasNextPage: false, hasPreviousPage: false, nextCursor: null },
  data: [],
};

@Injectable({ providedIn: 'root' })
export class ExerciseApiService {
  private http = inject(HttpClient);

  searchByName(name: string, limit = 20, cursor?: string): Observable<ExerciseApiResponse> {
    let params = new HttpParams()
      .set('name', name)
      .set('limit', limit);

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http
      .get<ExerciseApiResponse>(`${BASE_URL}/exercises`, { params })
      .pipe(catchError(() => of(EMPTY_RESPONSE)));
  }
}
