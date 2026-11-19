import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { PendingPeerAssignmentProtocol } from '@domain/entities/peer-evaluation.entity';
import { LoadPendingPeerAssignmentProtocolsUseCase } from '../../../application/load-pending-peer-assignment-protocols.use-case';
import { PeerAssignmentListPage } from './peer-assignment-list.page';

/** Datos de prueba (protocolos que no existen). */
const FULL: PendingPeerAssignmentProtocol = {
  id: 15,
  ceishCode: 'CEISH-PRUEBA-015',
  title: 'Estudio de prueba quince',
  studyType: 'Observacional',
  principalInvestigator: 'Investigadora Prueba',
  // 05:00 UTC del 4 = 00:00 del 4 en Ecuador.
  receptionDate: '2026-11-04T05:00:00.000Z',
  isTimelineTermsAccepted: true,
};

const EMPTY_FIELDS: PendingPeerAssignmentProtocol = {
  id: 16,
  ceishCode: null,
  title: null,
  studyType: null,
  principalInvestigator: null,
  receptionDate: null,
  isTimelineTermsAccepted: false,
};

describe('PeerAssignmentListPage (F03 D2)', () => {
  let execute: jasmine.Spy;
  let navigate: jasmine.Spy;

  function setup(...responses: Observable<PendingPeerAssignmentProtocol[]>[]): HTMLElement {
    execute = jasmine.createSpy('execute');
    execute.and.returnValues(...responses);
    TestBed.configureTestingModule({
      imports: [PeerAssignmentListPage],
      providers: [
        provideRouter([]),
        { provide: LoadPendingPeerAssignmentProtocolsUseCase, useValue: { execute } },
      ],
    });
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(PeerAssignmentListPage);
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
    detect = () => fixture.detectChanges();
    return root;
  }

  let root: HTMLElement;
  let detect: () => void;
  const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const rows = () => Array.from(root.querySelectorAll('tbody tr'));
  /** Texto de cada celda; los textos de sus partes (código y título) van separados por un espacio. */
  const cells = (row: Element) =>
    Array.from(row.querySelectorAll('td'), (td) => {
      const parts = Array.from(td.querySelectorAll('span'), (s) => text(s));
      return parts.length ? parts.join(' ') : text(td);
    });

  it('mientras carga muestra «Cargando protocolos por asignar…»', () => {
    setup(new Subject<PendingPeerAssignmentProtocol[]>());
    expect(text(root)).toContain('Cargando protocolos por asignar…');
    expect(root.querySelector('table')).toBeNull();
  });

  it('un error muestra «No pudimos cargar los protocolos por asignar.» y Reintentar vuelve a pedir', () => {
    setup(
      throwError(() => new Error('fallo')),
      of([FULL]),
    );
    expect(text(root)).toContain('No pudimos cargar los protocolos por asignar.');

    (root.querySelector('.state__retry') as HTMLButtonElement).click();
    detect();

    expect(execute).toHaveBeenCalledTimes(2);
    expect(rows().length).toBe(1);
  });

  it('sin protocolos muestra «No hay protocolos por asignar.»', () => {
    setup(of([]));
    expect(text(root)).toContain('No hay protocolos por asignar.');
    expect(root.querySelector('table')).toBeNull();
  });

  it('cada fila muestra el código, el título, el investigador, el tipo y la recepción', () => {
    setup(of([FULL]));
    expect(cells(rows()[0]).slice(0, 4)).toEqual([
      'CEISH-PRUEBA-015 Estudio de prueba quince',
      'Investigadora Prueba',
      'Observacional',
      '04/11/2026',
    ]);
    expect(text(root.querySelector('caption'))).toBe('Protocolos por asignar');
  });

  it('sin datos no inventa nada: «Sin título», «Sin investigador principal», «Sin tipo de estudio», «Sin fecha» y sin código', () => {
    setup(of([EMPTY_FIELDS]));
    const row = rows()[0];
    expect(cells(row).slice(0, 4)).toEqual([
      'Sin título',
      'Sin investigador principal',
      'Sin tipo de estudio',
      'Sin fecha',
    ]);
    expect(row.querySelector('.asignacion__codigo')).toBeNull();
  });

  it('«Asignar» abre el formulario de ese protocolo (EARS 3)', () => {
    setup(of([FULL]));
    const button = root.querySelector('tbody button') as HTMLButtonElement;
    expect(text(button)).toBe('Asignar');
    expect(button.getAttribute('aria-label')).toBe('Asignar evaluadores a CEISH-PRUEBA-015');

    button.click();

    expect(navigate).toHaveBeenCalledOnceWith(['/dashboard/evaluations/assignment', 15]);
  });

  it('sin los tiempos aceptados, «Asignar» está deshabilitado con el motivo enlazado (D10 (3))', () => {
    setup(of([EMPTY_FIELDS]));
    const button = root.querySelector('tbody button') as HTMLButtonElement;
    const reason = root.querySelector('#motivo-16');

    expect(button.disabled).toBeTrue();
    expect(text(reason)).toBe('El investigador aún no acepta los tiempos del comité.');
    expect(button.getAttribute('aria-describedby')).toBe('motivo-16');

    button.click();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('con los tiempos aceptados no hay motivo', () => {
    setup(of([FULL]));
    const button = root.querySelector('tbody button') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
    expect(button.getAttribute('aria-describedby')).toBeNull();
    expect(root.querySelector('.asignacion__motivo')).toBeNull();
  });
});
