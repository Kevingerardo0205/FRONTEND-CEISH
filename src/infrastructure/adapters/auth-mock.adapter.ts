import { Injectable } from "@angular/core";
import { Observable, of, throwError, delay } from "rxjs";
import { IAuthRepositoryPort } from "@domain/ports/IAuthRepositoryPort";
import { User, UserRole, UserDTO, AuthResponse, LoginCredentials, Permission } from "@domain/entities/user.entity";

import { RegisterInvestigadorRequest } from "@features/auth/domain/entities/register.request";
import { SetupAccountRequest } from "@features/auth/domain/entities/setup-account.request";

@Injectable({ providedIn: "root" })
export class AuthMockRepository implements IAuthRepositoryPort {
  
  private createPermission(code: string, modCode: string, modName: string): Permission {
    return { code, module: { code: modCode, name: modName, icon: "folder", order: 1 } };
  }

  private mockUsers: User[] = [
    {
      id: "1",
      email: "admin@espoch.edu.ec",
      nombre: "Administrador Sistema",
      rol: "ADMIN",
      perfil: "Administrador",
      activo: true,
      emailVerificado: true,
      permissions: ["ADMIN_ALL", "USUARIOS_VER", "USUARIOS_CREAR"],
      fullPermissions: [
        this.createPermission("DASHBOARD_VER_PRINCIPAL", "MOD_DASHBOARD", "Panel Principal"),
        this.createPermission("USUARIOS_VER", "MOD_USUARIOS", "Gestión de Usuarios"),
        this.createPermission("ADMIN_ALL", "MOD_AUDIT", "Seguridad")
      ]
    },
    {
      id: "2",
      email: "investigador@espoch.edu.ec",
      nombre: "Dr. Investigador CEISH",
      rol: "INVESTIGADOR",
      perfil: "Investigador Principal",
      activo: true,
      emailVerificado: true,
      permissions: ["RECEPCION_SUBIR_DOCUMENTOS", "RECEPCION_CREAR", "RECEPCION_INICIAR"],
      fullPermissions: [
        this.createPermission("DASHBOARD_VER_PRINCIPAL", "MOD_DASHBOARD", "Panel Principal"),
        this.createPermission("RECEPCION_INICIAR", "MOD_RECEPCION", "Recepción"),
        this.createPermission("RECEPCION_SUBIR_DOCUMENTOS", "MOD_RECEPCION", "Recepción")
      ]
    },
    {
      id: "3",
      email: "secretaria@espoch.edu.ec",
      nombre: "Secretaria CEISH",
      rol: "SECRETARIA",
      perfil: "Secretaria Técnica",
      activo: true,
      emailVerificado: true,
      permissions: ["RECEPCION_VER", "DOCUMENTOS_VALIDAR"],
      fullPermissions: [
        this.createPermission("DASHBOARD_VER_PRINCIPAL", "MOD_DASHBOARD", "Panel Principal"),
        this.createPermission("RECEPCION_VER", "MOD_RECEPCION", "Recepción"),
        this.createPermission("DOCUMENTOS_VALIDAR", "MOD_RECEPCION", "Recepción")
      ]
    }
  ];

  registerInvestigador(data: RegisterInvestigadorRequest): Observable<any> {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email,
      nombre: data.firstName + " " + data.firstLastName,
      rol: "INVESTIGADOR",
      activo: true,
      emailVerificado: false,
      permissions: ["RECEPCION_SUBIR_DOCUMENTOS", "RECEPCION_INICIAR"],
      fullPermissions: [
        this.createPermission("RECEPCION_INICIAR", "MOD_RECEPCION", "Recepción"),
        this.createPermission("RECEPCION_SUBIR_DOCUMENTOS", "MOD_RECEPCION", "Recepción")
      ]
    };
    this.mockUsers.push(newUser);
    return of({ success: true, data: newUser }).pipe(delay(1000));
  }

  verifyOTP(email: string, code: string): Observable<any> { return of({ success: true }).pipe(delay(800)); }
  setupAccount(data: SetupAccountRequest): Observable<any> { return of({ success: true }).pipe(delay(1000)); }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const user = this.mockUsers.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
    if (!user) return throwError(() => new Error("Usuario no encontrado"));
    return of({
      accessToken: "mock-jwt-" + Math.random(),
      refreshToken: "mock-refresh-" + Math.random(),
      user: { ...user },
      permissions: user.fullPermissions
    }).pipe(delay(500));
  }

  refreshToken(token: string): Observable<any> { return of({ accessToken: "new-mock-jwt", refreshToken: "new-mock-refresh" }); }
  getUsers(): Observable<User[]> { return of(this.mockUsers); }
  getUserById(id: string): Observable<User> {
    const user = this.mockUsers.find(u => u.id === id);
    return user ? of(user) : throwError(() => new Error("Not found"));
  }
  forgotPassword(email: string): Observable<any> { return of({ success: true }).pipe(delay(800)); }
  resetPassword(email: string, code: string, password: string): Observable<any> { return of({ success: true }).pipe(delay(1000)); }
  checkEmailExists(email: string): Observable<boolean> { return of(false); }
  createUser(user: any): Observable<User> { return of(user); }
  updateUser(id: string, user: any): Observable<User> { return of(user); }
  deleteUser(id: string): Observable<void> { return of(undefined); }
  logAudit(action: string, detail: string): Observable<void> { return of(undefined); }
}
