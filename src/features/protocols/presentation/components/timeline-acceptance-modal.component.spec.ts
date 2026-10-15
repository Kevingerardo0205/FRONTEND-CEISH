import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineAcceptanceModalComponent } from './timeline-acceptance-modal.component';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { of, throwError } from 'rxjs';

describe('TimelineAcceptanceModalComponent', () => {
  let component: TimelineAcceptanceModalComponent;
  let fixture: ComponentFixture<TimelineAcceptanceModalComponent>;
  let mockProtocolRepo: jasmine.SpyObj<IProtocolRepositoryPort>;

  beforeEach(async () => {
    mockProtocolRepo = jasmine.createSpyObj('IProtocolRepositoryPort', ['acceptTimeline']);
    mockProtocolRepo.acceptTimeline.and.returnValue(of({ message: 'ok' }));

    await TestBed.configureTestingModule({
      imports: [TimelineAcceptanceModalComponent],
      providers: [
        { provide: IProtocolRepositoryPort, useValue: mockProtocolRepo }
      ]
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

  it('debe alternar la aceptación al hacer toggle', () => {
    expect(component.isAccepted()).toBeFalse();
    component.toggleCheckbox();
    expect(component.isAccepted()).toBeTrue();
  });

  it('debe enviar la aceptación y emitir el output al confirmar', () => {
    let emitted = false;
    component.accepted.subscribe(() => emitted = true);

    component.toggleCheckbox();
    component.onConfirm();

    expect(mockProtocolRepo.acceptTimeline).toHaveBeenCalledWith('123');
    expect(component.isLoading()).toBeFalse();
    expect(emitted).toBeTrue();
  });

  it('debe manejar errores al confirmar', () => {
    mockProtocolRepo.acceptTimeline.and.returnValue(throwError(() => new Error('Error al procesar')));
    spyOn(console, 'error');
    spyOn(window, 'alert');

    component.toggleCheckbox();
    component.onConfirm();

    expect(component.isLoading()).toBeFalse();
    expect(window.alert).toHaveBeenCalled();
  });
});
