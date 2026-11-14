import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from 'src/app/app.config';
import { NO_ACTIVE_ROLE_MESSAGE } from '@infrastructure/guards/role-home.guard';
import { NotificationService } from '@infrastructure/services/notification.service';
import { TokenStoreAdapter } from '@infrastructure/storage/token-store.adapter';
import { ACCOUNT_LOCKED_MESSAGE, LoginPage } from './login.page';
import { OtpVerificationDialogComponent } from '../components/otp-verification/otp-verification-dialog.component';

/** Cuerpo real del HttpExceptionFilter del backend: el mensaje va en body.error.message. */
function backendError(status: number, message: string) {
  return {
    statusCode: status,
    timestamp: '2026-11-04T00:00:00.000Z',
    path: '/api/auth/login',
    error: { message, error: status === 403 ? 'Forbidden' : 'Unauthorized', statusCode: status },
  };
}

/**
 * T13d-4: login con la cadena real (ErrorInterceptor, AuthApiAdapter, LoginUseCase, LoginPage);
 * solo HTTP, el almacén de tokens, las notificaciones y MatDialog.open son de prueba.
 */
describe('LoginPage: errores del backend (T13d-4)', () => {
  let httpMock: HttpTestingController;
  let router: Router;
  let notify: jasmine.Spy;
  let openDialog: jasmine.Spy;
  let page: LoginPage;

  beforeEach(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('ceish.activeRole');
    notify = jasmine.createSpy('notify');
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        {
          provide: TokenStoreAdapter,
          useValue: {
            getToken: () => null,
            getRefreshToken: () => null,
            saveToken: () => undefined,
            saveRefreshToken: () => undefined,
            removeTokens: () => undefined,
          },
        },
        { provide: NotificationService, useValue: { notify } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    spyOn(router, 'navigate').and.resolveTo(true);
    openDialog = spyOn(MatDialog.prototype, 'open').and.returnValue({
      afterClosed: () => of(false),
    } as never);
    page = TestBed.createComponent(LoginPage).componentInstance;
    page.loginForm.setValue({ email: 'usuario.prueba@example.test', password: 'clave-de-prueba' });
  });

  afterEach(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('ceish.activeRole');
  });

  function failLogin(status: number, message: string): void {
    page.onSubmit();
    httpMock.expectOne('/api/auth/login').flush(backendError(status, message), {
      status,
      statusText: status === 403 ? 'Forbidden' : 'Unauthorized',
    });
  }

  it('403 de verificación (texto real) abre el OTP, sin navegar ni aviso de rol', () => {
    failLogin(403, 'Por favor, confirma tu correo electrónico antes de iniciar sesión.');

    expect(openDialog).toHaveBeenCalledOnceWith(OtpVerificationDialogComponent, jasmine.anything());
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalledWith(NO_ACTIVE_ROLE_MESSAGE, 'info');
  });

  it('403 de bloqueo muestra el mensaje de bloqueo, sin OTP ni navegación', () => {
    failLogin(403, 'Account temporarily locked. Try again later.');

    expect(page.errorMessage()).toBe(ACCOUNT_LOCKED_MESSAGE);
    expect(openDialog).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('401 de cuenta desactivada muestra su mensaje, sin OTP', () => {
    failLogin(401, 'Su cuenta está desactivada. Contacte al administrador.');

    expect(page.errorMessage()).toBe('Su cuenta está desactivada. Contacte al administrador.');
    expect(openDialog).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('si el OTP se cierra con éxito, el login se reintenta', () => {
    openDialog.and.returnValue({ afterClosed: () => of(true) } as never);

    failLogin(403, 'Por favor, confirma tu correo electrónico antes de iniciar sesión.');

    const retry = httpMock.expectOne('/api/auth/login');
    expect(retry.request.body).toEqual({
      email: 'usuario.prueba@example.test',
      password: 'clave-de-prueba',
    });
    retry.flush(backendError(401, 'Invalid credentials'), {
      status: 401,
      statusText: 'Unauthorized',
    });
    expect(openDialog).toHaveBeenCalledTimes(1);
  });
});
