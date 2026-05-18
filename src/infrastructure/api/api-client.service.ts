import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiClientService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  constructor() {}

  /**
   * Método genérico para peticiones GET
   */
  get<T>(url: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.append(key, params[key]);
        }
      });
    }
    return this.http.get<T>(`${this.baseUrl}${url}`, { params: httpParams });
  }

  /**
   * Método genérico para peticiones POST
   */
  post<T>(url: string, data?: any, config?: any): Observable<T> {
    if (!config || Object.keys(config).length === 0) {
      return this.http.post<T>(`${this.baseUrl}${url}`, data);
    }
    return this.http.post<T>(`${this.baseUrl}${url}`, data, config) as unknown as Observable<T>;
  }

  /**
   * Método genérico para peticiones PUT
   */
  put<T>(url: string, data?: any, config?: any): Observable<T> {
    if (!config || Object.keys(config).length === 0) {
      return this.http.put<T>(`${this.baseUrl}${url}`, data);
    }
    return this.http.put<T>(`${this.baseUrl}${url}`, data, config) as unknown as Observable<T>;
  }

  /**
   * Método genérico para peticiones PATCH
   */
  patch<T>(url: string, data?: any, config?: any): Observable<T> {
    if (!config || Object.keys(config).length === 0) {
      return this.http.patch<T>(`${this.baseUrl}${url}`, data);
    }
    return this.http.patch<T>(`${this.baseUrl}${url}`, data, config) as unknown as Observable<T>;
  }

  /**
   * Método genérico para peticiones DELETE
   */
  delete<T>(url: string, config?: any): Observable<T> {
    if (!config || Object.keys(config).length === 0) {
      return this.http.delete<T>(`${this.baseUrl}${url}`);
    }
    return this.http.delete<T>(`${this.baseUrl}${url}`, config) as unknown as Observable<T>;
  }
}
