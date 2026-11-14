import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SessionExpiredDialogComponent } from './session-expired-dialog.component';

describe('SessionExpiredDialogComponent', () => {
  let component: SessionExpiredDialogComponent;
  let fixture: ComponentFixture<SessionExpiredDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<SessionExpiredDialogComponent>>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SessionExpiredDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionExpiredDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y renderizar el título de sesión expirada', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.dialog-title')?.textContent).toContain('Sesión Expirada');
  });

  it('debe cerrar el diálogo y navegar a /auth/login al hacer clic en el botón de login', () => {
    component.onLogin();
    expect(mockDialogRef.close).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
