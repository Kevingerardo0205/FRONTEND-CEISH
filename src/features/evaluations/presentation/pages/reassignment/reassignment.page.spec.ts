import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ReassignmentPage, parseProtocolId } from './reassignment.page';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { EvaluationApiAdapter } from '@infrastructure/adapters/evaluation-api.adapter';
import {
  ModalReasignacionComponent,
  REASSIGN_SUCCESS_MESSAGE,
} from '../../components/modal-reasignacion/modal-reasignacion.component';
import {
  ACTIVE_ASSIGNMENTS_119_BODY,
  ERROR_404_BODY,
} from '../../../testing/reassignment.fixtures';

const ACTIVE_URL = (id: number) => `/api/evaluations/protocol/${id}/active-assignments`;
const HISTORY_URL = (id: number) => `/api/evaluations/protocol/${id}/reassignment-history`;

describe('ReassignmentPage', () => {
  let fixture: ComponentFixture<ReassignmentPage>;
  let component: ReassignmentPage;
  let httpMock: HttpTestingController;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackSpy: jasmine.SpyObj<MatSnackBar>;

  function setup(routeId: string | null): HTMLElement {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [ReassignmentPage, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: IEvaluationRepositoryPort, useClass: EvaluationApiAdapter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => (key === 'protocolId' ? routeId : null) },
            },
          },
        },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    });
    // MatSnackBarModule en los imports de la página provee su propio MatSnackBar y ocultaría el espía.
    TestBed.overrideComponent(ReassignmentPage, { remove: { imports: [MatSnackBarModule] } });

    fixture = TestBed.createComponent(ReassignmentPage);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function flushHistoryOk(id: number): void {
    httpMock.expectOne(HISTORY_URL(id)).flush({ data: [], statusCode: 200, message: 'Success' });
  }

  afterEach(() => httpMock.verify());

  it('carga el fixture real del protocolo 119: encabezado con ceishCode y versión, y 5 tarjetas', () => {
    const el = setup('119');
    httpMock.expectOne(ACTIVE_URL(119)).flush(ACTIVE_ASSIGNMENTS_119_BODY);
    flushHistoryOk(119);
    fixture.detectChanges();

    expect(el.querySelector('.protocol-badge')?.textContent?.trim()).toBe(
      'CEISH-ESPOCH-EI-007-2026',
    );
    expect(el.querySelector('.status-badge')?.textContent?.trim()).toBe('Versión 1');
    expect(el.querySelectorAll('app-tarjeta-evaluador').length).toBe(5);
    // Todas están en ASSIGNED: la acción de reasignar se muestra en las 5.
    expect(el.querySelectorAll('.btn-reassign').length).toBe(5);
    expect(component.errorMessage()).toBeNull();
    expect(component.isLoading()).toBeFalse();
  });

  it('oculta la acción de reasignar en asignaciones COMPLETED', () => {
    const el = setup('119');
    const body = structuredClone(ACTIVE_ASSIGNMENTS_119_BODY);
    body.data.assignments[0].status = 'COMPLETED';
    httpMock.expectOne(ACTIVE_URL(119)).flush(body);
    flushHistoryOk(119);
    fixture.detectChanges();

    expect(el.querySelectorAll('.btn-reassign').length).toBe(4);
  });

  for (const invalid of ['abc', '0', '-5', '1.5', ' 12', null]) {
    it(`ID de ruta inválido ${JSON.stringify(invalid)}: error visible y ninguna petición HTTP`, () => {
      const el = setup(invalid);

      httpMock.expectNone(() => true);
      expect(component.protocolId()).toBeNull();
      expect(el.querySelector('.alert-danger')?.textContent).toContain(
        'debe ser un número entero positivo',
      );
    });
  }

  it('si falla el historial muestra advertencia visible y conserva las asignaciones', () => {
    const el = setup('119');
    httpMock.expectOne(ACTIVE_URL(119)).flush(ACTIVE_ASSIGNMENTS_119_BODY);
    httpMock
      .expectOne(HISTORY_URL(119))
      .flush(ERROR_404_BODY, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(el.querySelectorAll('app-tarjeta-evaluador').length).toBe(5);
    expect(el.querySelector('.alert-warning')?.textContent).toContain(
      'No se pudo cargar el historial de reasignaciones: El protocolo con ID 0 no existe.',
    );
    expect(component.errorMessage()).toBeNull();
  });

  it('si fallan las asignaciones muestra el mensaje real del backend', () => {
    // Cuerpo 404 textual de la captura (menciona el ID 0 aunque aquí se consulta el 999).
    const el = setup('999');
    httpMock
      .expectOne(ACTIVE_URL(999))
      .flush(ERROR_404_BODY, { status: 404, statusText: 'Not Found' });
    flushHistoryOk(999);
    fixture.detectChanges();

    expect(el.querySelector('.alert-danger .alert-text')?.textContent?.trim()).toBe(
      'El protocolo con ID 0 no existe.',
    );
    expect(el.querySelectorAll('app-tarjeta-evaluador').length).toBe(0);
  });

  it('protocolo 99999 con ambos 404: solo el error de asignaciones, sin la advertencia del historial', () => {
    const el = setup('99999');
    httpMock
      .expectOne(ACTIVE_URL(99999))
      .flush(ERROR_404_BODY, { status: 404, statusText: 'Not Found' });
    httpMock
      .expectOne(HISTORY_URL(99999))
      .flush(ERROR_404_BODY, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(el.querySelectorAll('.alert-danger').length).toBe(1);
    expect(el.querySelector('.alert-warning')).toBeNull();
    expect(component.historyWarning()).toBeNull();
  });

  it('abre el modal con la asignación saliente y los evaluatorId activos; al confirmar muestra éxito y recarga', () => {
    setup('119');
    httpMock.expectOne(ACTIVE_URL(119)).flush(ACTIVE_ASSIGNMENTS_119_BODY);
    flushHistoryOk(119);

    const dialogRef = jasmine.createSpyObj<MatDialogRef<ModalReasignacionComponent>>(
      'MatDialogRef',
      ['afterClosed'],
    );
    dialogRef.afterClosed.and.returnValue(of(true));
    dialogSpy.open.and.returnValue(dialogRef);

    const ana = component.activeAssignments()[0];
    component.openReassignModal(ana);

    expect(dialogSpy.open).toHaveBeenCalledWith(
      ModalReasignacionComponent,
      jasmine.objectContaining({
        data: { outgoingAssignment: ana, activeEvaluatorIds: [39, 40, 41, 42, 43] },
      }),
    );
    expect(component.successMessage()).toBe(REASSIGN_SUCCESS_MESSAGE);
    expect(snackSpy.open).toHaveBeenCalledWith(
      REASSIGN_SUCCESS_MESSAGE,
      'Cerrar',
      jasmine.any(Object),
    );

    // Recarga: vuelve a pedir asignaciones e historial.
    httpMock.expectOne(ACTIVE_URL(119)).flush(ACTIVE_ASSIGNMENTS_119_BODY);
    flushHistoryOk(119);
  });
});

describe('parseProtocolId', () => {
  it('solo acepta enteros positivos en base 10', () => {
    expect(parseProtocolId('119')).toBe(119);
    expect(parseProtocolId('0119')).toBeNull();
    expect(parseProtocolId('1e3')).toBeNull();
    expect(parseProtocolId('99999999999999999999')).toBeNull();
  });
});
