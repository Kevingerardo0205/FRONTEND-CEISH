import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { User, UserRole, UserDTO, AuthResponse, LoginCredentials } from '@domain/entities/user.entity';
import { TokenStoreAdapter } from '@infrastructure/storage/token-store.adapter';

@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  private currentUserSignal = signal<User | null>(null);
  public currentUser = this.currentUserSignal.asReadonly();

  constructor(private tokenService: TokenStoreAdapter) {
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
    
    return of({ accessToken: 'new-mock-access-token' }).pipe(delay(500));
  }
}
