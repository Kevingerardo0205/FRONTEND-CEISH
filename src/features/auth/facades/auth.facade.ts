import { Injectable, signal, inject } from '@angular/core';
import { Observable, of, throwError, delay, tap, catchError } from 'rxjs';
import { User, AuthResponse, LoginCredentials } from '@domain/entities/user.entity';
import { TokenStoreAdapter } from '@infrastructure/storage/token-store.adapter';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';

@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  private tokenService = inject(TokenStoreAdapter);
  private authRepository = inject(IAuthRepositoryPort);
  
  private currentUserSignal = signal<User | null>(null);
  public currentUser = this.currentUserSignal.asReadonly();

  // Gestión de intentos de login
  private readonly MAX_ATTEMPTS = 3;
  private attemptsSignal = signal<Record<string, number>>({});

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const attempts = this.attemptsSignal()[credentials.email] || 0;

    if (attempts >= this.MAX_ATTEMPTS) {
      return throwError(() => new Error('Cuenta bloqueada por seguridad. Contacte al administrador.'));
    }

    return this.authRepository.login(credentials).pipe(
      tap((res) => {
        this.setAuth(res);
        this.resetAttempts(credentials.email);
      }),
      catchError((error) => {
        this.incrementAttempts(credentials.email);
        const currentAttempts = this.attemptsSignal()[credentials.email];
        if (currentAttempts >= this.MAX_ATTEMPTS) {
          return throwError(() => new Error('Tercer intento fallido. Cuenta bloqueada.'));
        }
        return throwError(() => error);
      })
    );
  }

  private incrementAttempts(email: string) {
    const current = this.attemptsSignal();
    this.attemptsSignal.set({
      ...current,
      [email]: (current[email] || 0) + 1
    });
  }

  private resetAttempts(email: string) {
    const current = this.attemptsSignal();
    const { [email]: _, ...rest } = current;
    this.attemptsSignal.set(rest);
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
    const token = this.tokenService.getToken();
    const userStr = localStorage.getItem('user');

    if (userStr) {
      this.currentUserSignal.set(JSON.parse(userStr));
    }

    // Si hay token, validar y refrescar datos del usuario desde el servidor
    if (token) {
      this.authRepository.getUserById('me').subscribe({
        next: (user) => {
          this.currentUserSignal.set(user);
          localStorage.setItem('user', JSON.stringify(user));
        },
        error: () => {
          // Si el token es inválido o expiró, cerrar sesión
          this.logout();
        }
      });
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
