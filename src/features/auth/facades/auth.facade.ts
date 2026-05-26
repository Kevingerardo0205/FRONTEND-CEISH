import { Injectable, signal, inject, computed } from '@angular/core';
import { Observable, of, throwError, delay, tap, catchError } from 'rxjs';
import { User, AuthResponse, LoginCredentials, Module, Permission } from '@domain/entities/user.entity';
import { TokenStoreAdapter } from '@infrastructure/storage/token-store.adapter';
import { IAuthRepositoryPort } from '@domain/ports/IAuthRepositoryPort';
import { MODULE_UI_MAP, PERMISSION_UI_MAP, toSentenceCase } from '@shared/constants/menu-ui.config';

@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  private tokenService = inject(TokenStoreAdapter);
  private authRepository = inject(IAuthRepositoryPort);
  
  private currentUserSignal = signal<User | null>(null);
  public currentUser = this.currentUserSignal.asReadonly();

  /**
   * Genera la configuración del menú enriquecida con metadata de UI.
   * Aplica un "Mapeo Híbrido": Usa nombres amigables si existen, de lo contrario formatea el nombre del backend.
   */
  public menuConfig = computed(() => {
    try {
      const user = this.currentUser();
      if (!user) return [];

      const perms = user.fullPermissions || [];
      if (perms.length === 0) {
        console.warn('[AuthFacade] El usuario no tiene permisos detallados (fullPermissions vacíos).');
        return [];
      }

      const modulesMap = new Map<string, { 
        code: string;
        label: string; 
        icon: string; 
        order: number;
        subItems: any[] 
      }>();

      perms.forEach(p => {
        const mod = p.module;
        const permUI = PERMISSION_UI_MAP[p.code];
        
        // Si no hay configuración de UI para este permiso, y no tiene módulo, lo ignoramos para el menú
        if (!permUI && !mod) return;

        // Si el permiso tiene UI pero no tiene módulo (ej. vino como string), lo asignamos al Dashboard por defecto
        const modCode = mod?.code || 'MOD_DASHBOARD';
        const modUI = MODULE_UI_MAP[modCode];

        if (!modulesMap.has(modCode)) {
          modulesMap.set(modCode, {
            code: modCode,
            label: modUI?.label || toSentenceCase(mod?.name || modCode),
            icon: modUI?.icon || mod?.icon || 'folder',
            order: mod?.order || 1,
            subItems: []
          });
        }

        const path = permUI?.path || '/dashboard/home';
        const subItems = modulesMap.get(modCode)!.subItems;

        // De-duplicación por path único
        if (!subItems.some(item => item.path === path)) {
          subItems.push({
            code: p.code,
            label: permUI?.label || toSentenceCase(p.code),
            icon: permUI?.icon || 'chevron_right',
            path: path
          });
        }
      });

      const finalMenu = Array.from(modulesMap.values()).sort((a, b) => a.order - b.order);
      console.log('[AuthFacade] Menú generado:', finalMenu.length, 'módulos.');
      return finalMenu;
      
    } catch (err) {
      console.error('[AuthFacade] Error crítico al generar configuración del menú:', err);
      return [];
    }
  });

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
    return this.authRepository.refreshToken(refreshToken).pipe(
      tap((tokens) => {
        this.tokenService.saveToken(tokens.accessToken);
        if (tokens.refreshToken) {
          this.tokenService.saveRefreshToken(tokens.refreshToken);
        }
      })
    );
  }
}
