import { Injectable, signal, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, tap, catchError } from 'rxjs';
import { User, AuthResponse, LoginCredentials } from '@domain/entities/user.entity';
import { TokenStoreAdapter } from '@infrastructure/storage/token-store.adapter';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';

export const COMMITTEE_ROLES: readonly string[] = ['SECRETARIA', 'PRESIDENTE', 'EVALUADOR'];

export function canEnterInvestigatorAreaRule(
  user: User | null,
  hasAnyRole: (roles: string[]) => boolean,
): boolean {
  if (!user) return false;
  if (hasAnyRole([...COMMITTEE_ROLES])) return true;
  return !!user.emailVerificado;
}

@Injectable({
  providedIn: 'root',
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
      return throwError(
        () => new Error('Cuenta bloqueada por seguridad. Contacte al administrador.'),
      );
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
      }),
    );
  }

  private incrementAttempts(email: string) {
    const current = this.attemptsSignal();
    this.attemptsSignal.set({
      ...current,
      [email]: (current[email] || 0) + 1,
    });
  }

  private resetAttempts(email: string) {
    const current = this.attemptsSignal();
    const rest = { ...current };
    delete rest[email];
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
        error: (err) => {
          console.error('[AuthFacade] Error al validar sesión en inicio/refresco:', err);
          // Solo cerrar sesión si el token es explícitamente inválido (401 o 403)
          // Si es un error de red (status 0) o de servidor (5xx), conservamos los datos locales para evitar desconectar al usuario erróneamente.
          const status = err?.status || (err instanceof HttpErrorResponse ? err.status : null);
          if (status === 401 || status === 403) {
            console.warn('[AuthFacade] Sesión inválida/expirada. Cerrando sesión.');
            this.logout();
          } else {
            console.warn(
              '[AuthFacade] Error no crítico de red/servidor. Conservando sesión local.',
            );
          }
        },
      });
    }
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getToken();
  }

  /**
   * Obtiene la lista de roles normalizados del usuario activo (excluyendo roles temporales expirados si aplica).
   */
  getActiveRoles(): string[] {
    const user = this.currentUserSignal();
    if (!user) return [];

    if (user.userRoles && user.userRoles.length > 0) {
      return user.userRoles.filter((ur) => !ur.isExpired).map((ur) => ur.code.toUpperCase());
    }

    const rawRoles = user.roles && user.roles.length > 0 ? user.roles : [user.rol];
    return rawRoles.map((r) => r.toUpperCase());
  }

  /**
   * Verifica si el usuario actual posee un rol específico (soporta multi-rol).
   */
  hasRole(roleCode: string): boolean {
    if (!roleCode) return false;
    const activeRoles = this.getActiveRoles();
    return activeRoles.includes(roleCode.toUpperCase());
  }

  /**
   * Verifica si el usuario actual posee al menos uno de los roles especificados.
   */
  hasAnyRole(roleCodes: string[]): boolean {
    if (!roleCodes || roleCodes.length === 0) return false;
    const activeRoles = this.getActiveRoles();
    return roleCodes.some((r) => activeRoles.includes(r.toUpperCase()));
  }

  canEnterInvestigatorArea(): boolean {
    return canEnterInvestigatorAreaRule(this.currentUser(), (r) => this.hasAnyRole(r));
  }

  /**
   * Verifica si el usuario actual cuenta con un permiso específico (PBAC).
   */
  hasPermission(permCode: string): boolean {
    if (!permCode) return false;
    const user = this.currentUserSignal();
    if (!user) return false;
    const perms = user.permissions || [];
    if (perms.includes('ADMIN_ALL')) return true;
    return perms.includes(permCode);
  }

  /**
   * Verifica si el usuario cuenta con al menos uno de los permisos indicados.
   */
  hasAnyPermission(permCodes: string[]): boolean {
    if (!permCodes || permCodes.length === 0) return false;
    return permCodes.some((p) => this.hasPermission(p));
  }

  /**
   * Verifica si el usuario cuenta con todos los permisos requeridos.
   */
  hasAllPermissions(permCodes: string[]): boolean {
    if (!permCodes || permCodes.length === 0) return false;
    return permCodes.every((p) => this.hasPermission(p));
  }

  refreshSession(): Observable<User> {
    return this.authRepository.getUserById('me').pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      }),
    );
  }

  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.authRepository.refreshToken(refreshToken).pipe(
      tap((tokens) => {
        this.tokenService.saveToken(tokens.accessToken);
        if (tokens.refreshToken) {
          this.tokenService.saveRefreshToken(tokens.refreshToken);
        }
      }),
    );
  }
}
