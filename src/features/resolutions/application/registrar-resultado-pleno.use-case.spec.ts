import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { IResolucionContextoPort } from '@domain/ports/IResolucionContextoPort';
import { ValidacionResolucionError } from '@domain/entities/resolucion-contexto.entity';
import {
  RegistrarResultadoEntrada,
  RegistrarResultadoPlenoUseCase,
  construirCuerpoResultado,
  validarResultado,
} from './registrar-resultado-pleno.use-case';

const CONV = '11111111-1111-4111-8111-111111111111';
const CP = '22222222-2222-4222-8222-222222222222';

function entrada(overrides: Partial<RegistrarResultadoEntrada> = {}): RegistrarResultadoEntrada {
  return {
    convocatoriaId: CONV,
    convocatoriaProtocoloId: CP,
    resultado: 'APROBADO_DEFINITIVO',
    yaTieneResultado: false,
    ...overrides,
  };
}

describe('validarResultado', () => {
  it('APROBADO_DEFINITIVO no exige texto', () => {
    expect(validarResultado(entrada())).toBeNull();
  });

  it('NO_APROBADO exige motivo', () => {
    expect(validarResultado(entrada({ resultado: 'NO_APROBADO', motivo: '  ' }))).toBe(
      'Debe indicar el motivo del resultado «No aprobado».',
    );
    expect(validarResultado(entrada({ resultado: 'NO_APROBADO', motivo: 'Incumple.' }))).toBeNull();
  });

  it('APROBADO_CON_CONDICION exige observaciones', () => {
    expect(validarResultado(entrada({ resultado: 'APROBADO_CON_CONDICION' }))).toBe(
      'Debe indicar las observaciones de la aprobación con condición.',
    );
    expect(
      validarResultado(entrada({ resultado: 'APROBADO_CON_CONDICION', observaciones: 'Ajustar anexo.' })),
    ).toBeNull();
  });

  it('si ya hay resultado, la corrección exige motivo', () => {
    expect(validarResultado(entrada({ yaTieneResultado: true }))).toBe(
      'Debe indicar el motivo de la corrección del resultado.',
    );
    expect(validarResultado(entrada({ yaTieneResultado: true, motivoCorreccion: 'Error de transcripción.' }))).toBeNull();
  });
});

describe('construirCuerpoResultado', () => {
  it('envía solo los campos que aplican al resultado elegido', () => {
    expect(
      construirCuerpoResultado(
        entrada({ resultado: 'NO_APROBADO', motivo: ' Incumple. ', observaciones: 'no debe viajar' }),
      ),
    ).toEqual({ resultado: 'NO_APROBADO', motivo: 'Incumple.' });
    expect(
      construirCuerpoResultado(
        entrada({ resultado: 'APROBADO_CON_CONDICION', observaciones: 'Ajustar.', motivo: 'no debe viajar' }),
      ),
    ).toEqual({ resultado: 'APROBADO_CON_CONDICION', observaciones: 'Ajustar.' });
    expect(construirCuerpoResultado(entrada())).toEqual({ resultado: 'APROBADO_DEFINITIVO' });
  });

  it('en corrección añade motivoCorreccion', () => {
    expect(
      construirCuerpoResultado(entrada({ yaTieneResultado: true, motivoCorreccion: ' Error. ' })),
    ).toEqual({ resultado: 'APROBADO_DEFINITIVO', motivoCorreccion: 'Error.' });
  });
});

describe('RegistrarResultadoPlenoUseCase', () => {
  let useCase: RegistrarResultadoPlenoUseCase;
  let port: jasmine.SpyObj<IResolucionContextoPort>;

  beforeEach(() => {
    port = jasmine.createSpyObj<IResolucionContextoPort>('IResolucionContextoPort', ['registrarResultado']);
    port.registrarResultado.and.returnValue(of(undefined));
    TestBed.configureTestingModule({ providers: [{ provide: IResolucionContextoPort, useValue: port }] });
    useCase = TestBed.inject(RegistrarResultadoPlenoUseCase);
  });

  it('con datos válidos llama al puerto con el cuerpo construido', () => {
    useCase.execute(entrada({ resultado: 'NO_APROBADO', motivo: 'Incumple.' })).subscribe();
    expect(port.registrarResultado).toHaveBeenCalledWith(CONV, CP, { resultado: 'NO_APROBADO', motivo: 'Incumple.' });
  });

  it('sin motivo en No aprobado no llama al puerto', () => {
    let error: unknown;
    useCase.execute(entrada({ resultado: 'NO_APROBADO' })).subscribe({ error: (e) => (error = e) });
    expect(error).toEqual(jasmine.any(ValidacionResolucionError));
    expect(port.registrarResultado).not.toHaveBeenCalled();
  });
});
