import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { AuthResponse, User } from '../models/user.model';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  public currentUser = this.currentUserSignal.asReadonly();

  constructor(private tokenService: TokenService) {
    this.loadUserFromStorage();
  }

  setAuth(auth: AuthResponse): void {
    this.tokenService.saveToken(auth.accessToken);
    this.tokenService.saveRefreshToken(auth.refreshToken);
    if (auth.user) {
      this.currentUserSignal.set(auth.user);
      localStorage.setItem('user', JSON.stringify(auth.user));
    }
  }

  setUser(user: User): void {
    this.currentUserSignal.set(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  logout(): void {
    this.tokenService.removeTokens();
    this.currentUserSignal.set(null);
    localStorage.removeItem('user');
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUserSignal.set(JSON.parse(userStr));
    }
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getToken();
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    
    // En producción esto iría al backend
    // Simulamos éxito si tenemos el token
    return of({ accessToken: 'new-mock-access-token' }).pipe(delay(500));
  }
}
