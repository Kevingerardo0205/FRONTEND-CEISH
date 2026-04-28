import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';

@Injectable({
  providedIn: 'root'
})
export abstract class BaseApiService {

  constructor(protected apiClient: ApiClientService) {}

  protected get<T>(endpoint: string, params?: any): Observable<T> {
    return this.apiClient.get<T>(endpoint, { params }).pipe(
      catchError(this.handleError)
    );
  }

  protected post<T>(endpoint: string, body: any): Observable<T> {
    return this.apiClient.post<T>(endpoint, body).pipe(
      catchError(this.handleError)
    );
  }

  protected put<T>(endpoint: string, body: any): Observable<T> {
    return this.apiClient.put<T>(endpoint, body).pipe(
      catchError(this.handleError)
    );
  }

  protected delete<T>(endpoint: string): Observable<T> {
    return this.apiClient.delete<T>(endpoint).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    let errorMessage = 'Ocurrió un error inesperado';
    
    if (error.response) {
      errorMessage = error.response.data?.message || `Error ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'No se pudo conectar con el servidor';
    } else {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
