import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineAcceptanceModalComponent } from './timeline-acceptance-modal.component';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { of, throwError } from 'rxjs';

const ALREADY_ACCEPTED_400 = 'El sometimiento a los tiempos y reglamentos ya fue aceptado anteriormente';

describe('TimelineAcceptanceModalComponent', () => {
  let component: TimelineAcceptanceModalComponent;
  let fixture: ComponentFixture<TimelineAcceptanceModalComponent>;
  let mockProtocolRepo: jasmine.SpyObj<IProtocolRepositoryPort>;

  beforeEach(async () => {
    mockProtocolRepo = jasmine.createSpyObj('IProtocolRepositoryPort', ['acceptTimeline']);
    mockProtocolRepo.acceptTimeline.and.returnValue(of({ message: 'ok' }));

    await TestBed.configureTestingModule({
      imports: [TimelineAcceptanceModalComponent],
      providers: [{ provide: IProtocolRepositoryPort, useValue: mockProtocolRepo }],
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineAcceptanceModalComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('protocolId', 123);
    fixture.componentRef.setInput('ceishCode', 'CEISH-2026-001');
    fixture.componentRef.setInput('isOpen', true);

    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('dice la regla de los 20 días, sin fecha y sin plazos ni código inventados (F10 D15)', () => {
    const el = fixture.nativeElement as HTMLElement;
    const text = (el.textContent ?? '').replace(/\s+/g, ' ');

    expect(el.querySelector('h3')?.textContent?.trim()).toBe('Aceptación de los tiempos del comité');
    expect(el.querySelector('.archive-rule')?.textContent?.trim()).toBe(
      'Si no acepta en 20 días, el proceso se archivará.',
    );
    expect(text).toContain(
      'La Secretaría aprobó la documentación de su protocolo. Para continuar con la asignación de evaluadores, acepte someterse a los tiempos y al reglamento del CEISH-ESPOCH.',
    );
    expect(text).toContain('Acepto someterme a los tiempos y al reglamento del CEISH-ESPOCH.');
    expect(text).toContain('Aceptar los tiempos');
    expect(text).not.toContain('45 o 60');
    expect(text).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(text).toContain('CEISH-2026-001');

    fixture.componentRef.setInput('ceishCode', '');
    fixture.detectChanges();
    expect(el.textContent).not.toContain('En trámite');
    expect(el.querySelector('.protocol-badge')).toBeNull();
  });

  it('sin mensaje del backend muestra "No pudimos registrar su aceptación. Intente de nuevo."', () => {
    mockProtocolRepo.acceptTimeline.and.returnValue(throwError(() => new Error('')));
    spyOn(console, 'error');

    component.toggleCheckbox();
    component.onConfirm();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent?.trim(),
    ).toBe('No pudimos registrar su aceptación. Intente de nuevo.');
  });

  it('debe alternar la aceptación al hacer toggle', () => {
    expect(component.isAccepted()).toBeFalse();
    component.toggleCheckbox();
    expect(component.isAccepted()).toBeTrue();
  });

  it('debe enviar la aceptación y emitir el output al confirmar', () => {
    let emitted = false;
    component.accepted.subscribe(() => (emitted = true));

    component.toggleCheckbox();
    component.onConfirm();

    expect(mockProtocolRepo.acceptTimeline).toHaveBeenCalledWith('123');
    expect(component.isLoading()).toBeFalse();
    expect(emitted).toBeTrue();
  });

  it('debe manejar errores al confirmar: el mensaje sale dentro del aviso, sin alert (F10 D15)', () => {
    // El 400 de "ya fue aceptado" del backend `dev` (protocols.service.ts:260), como lo relanza
    // ErrorInterceptor (Error con el mensaje y el status).
    mockProtocolRepo.acceptTimeline.and.returnValue(
      throwError(() => Object.assign(new Error(ALREADY_ACCEPTED_400), { status: 400 })),
    );
    spyOn(console, 'error');
    spyOn(window, 'alert');

    component.toggleCheckbox();
    component.onConfirm();
    fixture.detectChanges();

    expect(component.isLoading()).toBeFalse();
    expect(window.alert).not.toHaveBeenCalled();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent?.trim(),
    ).toBe(ALREADY_ACCEPTED_400);
  });
});
