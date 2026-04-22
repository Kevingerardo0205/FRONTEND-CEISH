import { Injectable, signal } from '@angular/core';
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
    this.tokenService.saveToken(auth.token);
    this.tokenService.saveRefreshToken(auth.refreshToken);
    this.currentUserSignal.set(auth.user);
    localStorage.setItem('user', JSON.stringify(auth.user));
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
}
