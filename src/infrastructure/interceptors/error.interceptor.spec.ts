import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ErrorInterceptor } from './error.interceptor';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { of } from 'rxjs';
import { SessionExpiredDialogComponent } from '@shared/components/session-expired-dialog/session-expired-dialog.component';

describe('ErrorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthFacade: jasmine.SpyObj<AuthFacade>;

  beforeEach(() => {
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
    Object.defineProperty(mockDialog, 'openDialogs', { get: () => [] });
    mockDialog.open.and.returnValue({
      afterClosed: () => of(true)
    } as any);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockAuthFacade = jasmine.createSpyObj('AuthFacade', ['refreshToken', 'logout']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ErrorInterceptor,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: ErrorInterceptor,
          multi: true
        },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
        { provide: AuthFacade, useValue: mockAuthFacade }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe reintentar llamadas GET fallidas en caso de error 503 y luego fallar', (done) => {
    httpClient.get('/api/protocols').subscribe({
      next: () => fail('No debería tener éxito'),
      error: (error) => {
        expect(error).toBeTruthy();
        done();
      }
    });

    const req1 = httpMock.expectOne('/api/protocols');
    req1.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

    setTimeout(() => {
      const req2 = httpMock.expectOne('/api/protocols');
      req2.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

      setTimeout(() => {
        const req3 = httpMock.expectOne('/api/protocols');
        req3.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
      }, 1050);
    }, 1050);
  });

  it('no debe reintentar llamadas POST fallidas con error 503', (done) => {
    httpClient.post('/api/protocols', {}).subscribe({
      next: () => fail('No debería tener éxito'),
      error: (error) => {
        expect(error).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne('/api/protocols');
    req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
  });

  it('debe mostrar un toast de error ante estados 500, 503 y 0', (done) => {
    httpClient.post('/api/protocols', {}).subscribe({
      next: () => fail('No debería tener éxito'),
      error: () => {
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'El servidor del CEISH está experimentando problemas. Por favor, inténtelo de nuevo más tarde.',
          'Cerrar',
          { duration: 5000 }
        );
        done();
      }
    });

    const req = httpMock.expectOne('/api/protocols');
    req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('debe mapear errores 409 a tipo CONCURRENCY_ERROR', (done) => {
    httpClient.post('/api/protocols', {}).subscribe({
      next: () => fail('No debería tener éxito'),
      error: (error) => {
        expect(error.type).toBe('CONCURRENCY_ERROR');
        expect(error.status).toBe(409);
        done();
      }
    });

    const req = httpMock.expectOne('/api/protocols');
    req.flush({ message: 'Conflicto de versiones' }, { status: 409, statusText: 'Conflict' });
  });

  it('debe cerrar sesión y abrir la ventana flotante centrada SessionExpiredDialogComponent si /auth/refresh falla con 401', (done) => {
    httpClient.post('/api/auth/refresh', {}).subscribe({
      next: () => fail('No debería tener éxito'),
      error: (error) => {
        expect(mockAuthFacade.logout).toHaveBeenCalled();
        expect(mockDialog.open).toHaveBeenCalledWith(SessionExpiredDialogComponent, jasmine.objectContaining({
          disableClose: true,
          width: '460px'
        }));
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      }
    });

    const req = httpMock.expectOne('/api/auth/refresh');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });
});
