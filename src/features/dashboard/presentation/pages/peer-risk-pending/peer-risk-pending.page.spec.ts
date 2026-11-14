import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject, of, throwError } from 'rxjs';
import { PendingPeerAssignmentProtocol } from '@domain/entities/peer-evaluation.entity';
import { LoadPendingPeerAssignmentProtocolsUseCase } from '@features/evaluations/application/load-pending-peer-assignment-protocols.use-case';
import { PeerRiskPendingTableComponent } from '../../components/peer-risk-pending-table/peer-risk-pending-table.component';
import { PeerRiskPendingPage } from './peer-risk-pending.page';

describe('PeerRiskPendingPage (F01 T01-0)', () => {
  let fixture: ComponentFixture<PeerRiskPendingPage>;
  let execute: jasmine.Spy;

  const protocolo: PendingPeerAssignmentProtocol = {
    id: 5,
    ceishCode: 'IO-999-2026',
    title: 'Estudio de prueba',
    receptionStatus: 'COMPLETO',
    isRiskLevelDesignated: false,
    createdAt: '2026-10-01T10:00:00.000Z',
    studyType: { id: 1, codigo: 'IO', nombre: 'Observacional' },
    principalInvestigatorRecord: { id: 2, fullName: 'Investigador de prueba', email: '' },
  };

  function render(): HTMLElement {
    TestBed.configureTestingModule({
      imports: [PeerRiskPendingPage],
      providers: [{ provide: LoadPendingPeerAssignmentProtocolsUseCase, useValue: { execute } }],
    });
    fixture = TestBed.createComponent(PeerRiskPendingPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const text = (el: HTMLElement) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  beforeEach(() => {
    execute = jasmine.createSpy('execute');
  });

  it('muestra el encabezado "Estratificación de Riesgo"', () => {
    execute.and.returnValue(of([]));
    const el = render();

    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Estratificación de Riesgo');
  });

  it('mientras carga muestra LoadingState', () => {
    execute.and.returnValue(new Subject<PendingPeerAssignmentProtocol[]>());
    const el = render();

    expect(el.querySelector('app-loading-state')).not.toBeNull();
    expect(text(el)).toContain('Cargando protocolos pendientes…');
    expect(el.querySelector('app-peer-risk-pending-table')).toBeNull();
  });

  it('con error muestra ErrorState y Reintentar vuelve a pedir la bandeja', () => {
    execute.and.returnValue(throwError(() => new Error('falla')));
    const el = render();

    expect(el.querySelector('app-error-state')).not.toBeNull();
    expect(text(el)).toContain('No pudimos cargar los protocolos pendientes.');
    expect(el.querySelector('app-peer-risk-pending-table')).toBeNull();

    execute.and.returnValue(of([protocolo]));
    (el.querySelector('app-error-state button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(execute).toHaveBeenCalledTimes(2);
    expect(el.querySelector('app-error-state')).toBeNull();
    expect(el.querySelector('app-peer-risk-pending-table')).not.toBeNull();
  });

  it('sin protocolos muestra EmptyState y no la tabla', () => {
    execute.and.returnValue(of([]));
    const el = render();

    expect(el.querySelector('app-empty-state')).not.toBeNull();
    expect(text(el)).toContain('No hay protocolos pendientes de estratificación de riesgo.');
    expect(el.querySelector('app-peer-risk-pending-table')).toBeNull();
  });

  it('con protocolos muestra la tabla con la lista convertida', () => {
    execute.and.returnValue(of([protocolo]));
    const el = render();

    const table = fixture.debugElement.query(By.directive(PeerRiskPendingTableComponent));
    expect(table).not.toBeNull();
    expect((table.componentInstance as PeerRiskPendingTableComponent).protocols()).toEqual([
      protocolo,
    ]);
    expect(text(el)).toContain('IO-999-2026');
  });

  it('una respuesta que no es arreglo se trata como bandeja vacía', () => {
    execute.and.returnValue(of(null as unknown as PendingPeerAssignmentProtocol[]));
    const el = render();

    expect(el.querySelector('app-empty-state')).not.toBeNull();
  });

  it('al asignar pares (assignmentCompleted) vuelve a cargar la bandeja', () => {
    execute.and.returnValue(of([protocolo]));
    render();
    const table = fixture.debugElement.query(By.directive(PeerRiskPendingTableComponent));

    execute.and.returnValue(of([]));
    (table.componentInstance as PeerRiskPendingTableComponent).assignmentCompleted.emit();
    fixture.detectChanges();

    expect(execute).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('app-empty-state')).not.toBeNull();
  });
});
