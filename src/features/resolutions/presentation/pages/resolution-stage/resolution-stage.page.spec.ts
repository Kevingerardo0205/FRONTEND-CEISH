import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { ActiveRoleFacade } from '@features/shell/application/active-role.facade';
import { RoleCode } from '@domain/value-objects/role.vo';
import { CartaVersion, ConvocatoriaContexto } from '@domain/entities/resolucion-contexto.entity';
import { IResolucionContextoPort } from '@domain/ports/IResolucionContextoPort';
import { ResolutionStagePage, SIN_SESION_PLENO } from './resolution-stage.page';

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
    puedeRegistrarResultado: false,
    puedeSubirCarta: false,
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
    'registrarResultado',
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

  it('SECRETARIA sin puedeRegistrarResultado no ve el formulario de resultado', () => {
    const { fixture } = montar(of([convocatoria({ puedeRegistrarResultado: false })]), 'SECRETARIA');
    expect(existe(fixture, '[data-testid="select-resultado"]')).toBeFalse();
  });

  it('SECRETARIA con puedeRegistrarResultado ve el formulario de resultado', () => {
    const { fixture } = montar(of([convocatoria({ puedeRegistrarResultado: true })]), 'SECRETARIA');
    expect(existe(fixture, '[data-testid="select-resultado"]')).toBeTrue();
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
          puedeRegistrarResultado: true,
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
          puedeRegistrarResultado: true,
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
});
