import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { RoleCode } from '@domain/value-objects/role.vo';
import { CartaVersion, ConvocatoriaContexto } from '@domain/entities/resolucion-contexto.entity';
import { IResolucionContextoPort } from '@domain/ports/IResolucionContextoPort';
import {
  AVISO_INMUTABLE,
  ResolutionStagePage,
  SIN_SESION_PLENO,
  TEXTO_LEGACY,
  TEXTO_NO_SUBIDA,
  TEXTO_PENDIENTE,
  TEXTO_RESOLVIENDO,
  TEXTO_REUNION_FUTURA,
} from './resolution-stage.page';

/** Fechas fijas lejanas: la prueba no depende del reloj del equipo. */
const REUNION_PASADA = '2020-01-01T15:00:00.000Z';
const REUNION_FUTURA = '2999-01-01T15:00:00.000Z';
const RESUMEN = { aprobado: 2, conCondicion: 1, noAprobado: 0, pendientes: 0 };

const CONV = '11111111-1111-4111-8111-111111111111';
const CP = '22222222-2222-4222-8222-222222222222';

function convocatoria(overrides: Partial<ConvocatoriaContexto> = {}): ConvocatoriaContexto {
  return {
    convocatoriaId: CONV,
    convocatoriaProtocoloId: CP,
    numeroConvocatoria: 'C-2026-01',
    fechaReunion: '2026-11-20T15:00:00.000Z',
    versionEvaluada: 2,
    resultado: null,
    anexoEsperado: null,
    cartaVigente: null,
    puedeSubirCarta: false,
    estadoResultado: 'PENDIENTE',
    resultadoCalculado: null,
    resolucionAnterior: null,
    resueltoEnConvocatoria: null,
    ...overrides,
  };
}

const versionHistorial: CartaVersion = {
  id: 'v1',
  numeroVersion: 1,
  resultado: 'APROBADO_DEFINITIVO',
  anexoCodigo: 'ANEXO_13',
  vigente: true,
  motivoReemplazo: null,
  subidoEn: '2026-11-21T10:00:00.000Z',
};

/** Monta la etapa con un contexto (o un error) y un rol activo. Una llamada por prueba. */
function montar(
  contexto$: Observable<ConvocatoriaContexto[]>,
  rolActivo: RoleCode,
): { fixture: ComponentFixture<ResolutionStagePage>; port: jasmine.SpyObj<IResolucionContextoPort> } {
  const port = jasmine.createSpyObj<IResolucionContextoPort>('IResolucionContextoPort', [
    'obtenerContexto',
    'listarCartas',
    'urlDescargaCarta',
    'solicitarSubida',
    'subirArchivo',
    'registrarCarta',
  ]);
  port.obtenerContexto.and.returnValue(contexto$);
  port.listarCartas.and.returnValue(of([versionHistorial]));

  TestBed.configureTestingModule({
    imports: [ResolutionStagePage],
    providers: [
      { provide: IResolucionContextoPort, useValue: port },
      { provide: ActiveRoleFacade, useValue: { activeRole: signal<RoleCode | null>(rolActivo).asReadonly() } },
      {
        provide: ActivatedRoute,
        useValue: {
          parent: { paramMap: of(convertToParamMap({ id: '7' })) },
          paramMap: of(convertToParamMap({})),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(ResolutionStagePage);
  fixture.detectChanges();
  return { fixture, port };
}

function texto(fixture: ComponentFixture<ResolutionStagePage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function existe(fixture: ComponentFixture<ResolutionStagePage>, selector: string): boolean {
  return (fixture.nativeElement as HTMLElement).querySelector(selector) !== null;
}

describe('ResolutionStagePage', () => {
  it('lista vacía: muestra el texto fijo, sin acciones ni historial', () => {
    const { fixture, port } = montar(of([]), 'SECRETARIA');
    expect(fixture.nativeElement.querySelector('[data-testid="sin-sesion-pleno"]').textContent).toContain(
      SIN_SESION_PLENO,
    );
    expect(existe(fixture, 'form')).toBeFalse();
    expect(port.listarCartas).not.toHaveBeenCalled();
  });

  it('SECRETARIA sin puedeSubirCarta no ve el formulario de carta', () => {
    const { fixture } = montar(of([convocatoria({ puedeSubirCarta: false, anexoEsperado: 'ANEXO_13' })]), 'SECRETARIA');
    expect(existe(fixture, '[data-testid="input-archivo"]')).toBeFalse();
  });

  it('SECRETARIA con puedeSubirCarta ve el formulario y el anexo que indica el backend', () => {
    const { fixture } = montar(of([convocatoria({ puedeSubirCarta: true, anexoEsperado: 'ANEXO_14' })]), 'SECRETARIA');
    expect(existe(fixture, '[data-testid="input-archivo"]')).toBeTrue();
    expect(texto(fixture)).toContain('ANEXO_14');
  });

  it('SECRETARIA con carta vigente pide motivo de reemplazo', () => {
    const { fixture } = montar(
      of([
        convocatoria({
          puedeSubirCarta: true,
          anexoEsperado: 'ANEXO_13',
          cartaVigente: { numeroVersion: 1, anexoCodigo: 'ANEXO_13', subidoEn: '2026-11-21T10:00:00.000Z', claveArchivo: 'k' },
        }),
      ]),
      'SECRETARIA',
    );
    expect(texto(fixture)).toContain('Motivo del reemplazo');
  });

  it('PRESIDENTE: solo lectura aunque los flags digan true; ve motivo, observaciones e historial', () => {
    const { fixture, port } = montar(
      of([
        convocatoria({
          puedeSubirCarta: true,
          resultado: 'NO_APROBADO',
          anexoEsperado: 'ANEXO_13',
          motivo: 'Incumple el anexo.',
          observaciones: 'Revisar.',
        }),
      ]),
      'PRESIDENTE',
    );
    expect(existe(fixture, 'form')).toBeFalse();
    expect(texto(fixture)).toContain('Incumple el anexo.');
    expect(texto(fixture)).toContain('Revisar.');
    expect(port.listarCartas).toHaveBeenCalledWith(CONV, CP);
    expect(texto(fixture)).toContain('Historial de versiones');
  });

  it('INVESTIGADOR: sin formularios, sin motivo, sin observaciones y sin historial', () => {
    const { fixture, port } = montar(
      of([
        convocatoria({
          puedeSubirCarta: true,
          resultado: 'NO_APROBADO',
          motivo: 'Dato interno',
          observaciones: 'Dato interno',
          cartaVigente: { numeroVersion: 1, anexoCodigo: 'ANEXO_13', subidoEn: '2026-11-21T10:00:00.000Z', claveArchivo: 'k' },
        }),
      ]),
      'INVESTIGADOR',
    );
    expect(existe(fixture, 'form')).toBeFalse();
    expect(texto(fixture)).not.toContain('Dato interno');
    expect(texto(fixture)).not.toContain('Motivo:');
    expect(texto(fixture)).not.toContain('Observaciones:');
    expect(texto(fixture)).not.toContain('Historial de versiones');
    expect(port.listarCartas).not.toHaveBeenCalled();
    expect(existe(fixture, '[data-testid="carta-vigente"]')).toBeTrue();
  });

  it('solo la primera convocatoria es la de trabajo; las demás aparecen como sesiones anteriores', () => {
    const { fixture } = montar(
      of([
        convocatoria({ numeroConvocatoria: 'C-2026-02' }),
        convocatoria({ convocatoriaId: 'otra', numeroConvocatoria: 'C-2025-09', resultado: 'APROBADO_DEFINITIVO' }),
      ]),
      'PRESIDENTE',
    );
    expect(texto(fixture)).toContain('Convocatoria C-2026-02');
    expect(texto(fixture)).toContain('Sesiones anteriores del pleno');
    expect(texto(fixture)).toContain('Convocatoria C-2025-09');
  });

  it('un 404 del backend en la carga se muestra tal cual', () => {
    const { fixture } = montar(
      throwError(() => ({ status: 404, error: { message: 'Protocolo no encontrado.' } })),
      'SECRETARIA',
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Protocolo no encontrado.');
  });

  it('SECRETARIA no ve formulario de resultado: ni selector ni botón de guardar resultado', () => {
    const { fixture } = montar(
      of([convocatoria({ fechaReunion: REUNION_PASADA, estadoResultado: 'CALCULADO', resultado: 'APROBADO_DEFINITIVO' })]),
      'SECRETARIA',
    );
    expect(existe(fixture, 'select')).toBeFalse();
    expect(texto(fixture)).not.toContain('Guardar resultado');
    expect(texto(fixture)).not.toContain('Registrar resultado del pleno');
  });

  it('SECRETARIA ve el aviso de inmutable y el resumen solo con conteos', () => {
    const { fixture } = montar(
      of([
        convocatoria({
          fechaReunion: REUNION_PASADA,
          estadoResultado: 'CALCULADO',
          resultado: 'APROBADO_CON_CONDICION',
          anexoEsperado: 'ANEXO_14',
          resumenDictamenes: RESUMEN,
        }),
      ]),
      'SECRETARIA',
    );
    expect(texto(fixture)).toContain(AVISO_INMUTABLE);
    expect(texto(fixture)).toContain('Resultado calculado: Aprobado con condición.');
    const resumen = (fixture.nativeElement.querySelector('[data-testid="resumen-dictamenes"]') as HTMLElement).textContent ?? '';
    expect(resumen).toContain('2 aprobados');
    expect(resumen).toContain('1 con condición');
    expect(resumen).toContain('0 no aprobados');
    expect(resumen).toContain('0 pendientes');
  });

  it('INVESTIGADOR sin carta vigente ve el texto de comité resolviendo y nunca el resumen ni el cálculo', () => {
    const { fixture } = montar(
      of([
        convocatoria({
          fechaReunion: REUNION_PASADA,
          estadoResultado: 'CALCULADO',
          resultado: null,
          resumenDictamenes: RESUMEN,
        }),
      ]),
      'INVESTIGADOR',
    );
    expect(texto(fixture)).toContain(TEXTO_RESOLVIENDO);
    expect(existe(fixture, '[data-testid="resumen-dictamenes"]')).toBeFalse();
    expect(texto(fixture)).not.toContain('2 aprobados');
    expect(texto(fixture)).not.toContain('Resultado calculado');
    expect(texto(fixture)).not.toContain(AVISO_INMUTABLE);
  });

  it('INVESTIGADOR con carta vigente ve el resultado congelado y no el resumen', () => {
    const { fixture } = montar(
      of([
        convocatoria({
          fechaReunion: REUNION_PASADA,
          estadoResultado: 'CONGELADO',
          resultado: 'NO_APROBADO',
          cartaVigente: { numeroVersion: 1, anexoCodigo: 'ANEXO_13', subidoEn: '2026-11-21T10:00:00.000Z', claveArchivo: 'k' },
        }),
      ]),
      'INVESTIGADOR',
    );
    expect(texto(fixture)).toContain('Resultado: No aprobado.');
    expect(texto(fixture)).not.toContain(TEXTO_RESOLVIENDO);
    expect(existe(fixture, '[data-testid="resumen-dictamenes"]')).toBeFalse();
  });

  it('SECRETARIA con puedeSubirCarta false no ve el botón de subir y ve el mensaje genérico', () => {
    const { fixture } = montar(
      of([convocatoria({ fechaReunion: REUNION_PASADA, puedeSubirCarta: false, estadoResultado: 'RESUELTO_LEGACY' })]),
      'SECRETARIA',
    );
    expect(existe(fixture, '[data-testid="input-archivo"]')).toBeFalse();
    expect(texto(fixture)).not.toContain('Subir carta');
    expect(existe(fixture, '[data-testid="sin-subida"]')).toBeTrue();
    expect(texto(fixture)).toContain(TEXTO_NO_SUBIDA);
  });

  it('reunión futura: muestra que aún no se realizó y no repite el mensaje genérico', () => {
    const { fixture } = montar(
      of([convocatoria({ fechaReunion: REUNION_FUTURA, puedeSubirCarta: false, estadoResultado: 'PENDIENTE' })]),
      'SECRETARIA',
    );
    expect(texto(fixture)).toContain(TEXTO_REUNION_FUTURA);
    expect(texto(fixture)).toContain(TEXTO_PENDIENTE);
    expect(existe(fixture, '[data-testid="sin-subida"]')).toBeFalse();
  });

  it('CONGELADO en otra convocatoria: muestra «Resuelto en la convocatoria» con su número', () => {
    const { fixture } = montar(
      of([
        convocatoria({
          fechaReunion: REUNION_PASADA,
          estadoResultado: 'CONGELADO',
          resultado: 'APROBADO_DEFINITIVO',
          resueltoEnConvocatoria: 'C-2025-09',
        }),
      ]),
      'PRESIDENTE',
    );
    expect(texto(fixture)).toContain('Resuelto en la convocatoria C-2025-09.');
  });

  it('RESUELTO_LEGACY muestra el texto del flujo anterior', () => {
    const { fixture } = montar(
      of([convocatoria({ fechaReunion: REUNION_PASADA, estadoResultado: 'RESUELTO_LEGACY' })]),
      'PRESIDENTE',
    );
    expect(texto(fixture)).toContain(TEXTO_LEGACY);
  });
});
