import { ConvocatoriaContexto, EstadoResultado, gestionadoPorFlujoNuevo } from './resolucion-contexto.entity';

function convocatoriaEn(estadoResultado: EstadoResultado): ConvocatoriaContexto {
  return {
    convocatoriaId: '11111111-1111-4111-8111-111111111111',
    convocatoriaProtocoloId: '22222222-2222-4222-8222-222222222222',
    numeroConvocatoria: 'C-2026-01',
    fechaReunion: null,
    versionEvaluada: 1,
    resultado: null,
    anexoEsperado: null,
    cartaVigente: null,
    puedeSubirCarta: false,
    estadoResultado,
    resultadoCalculado: null,
    resolucionAnterior: null,
    resueltoEnConvocatoria: null,
  };
}

describe('gestionadoPorFlujoNuevo (regla de convivencia con el flujo viejo, EP7)', () => {
  it('lista vacía (sin convocatoria): el flujo viejo sigue visible', () => {
    expect(gestionadoPorFlujoNuevo([])).toBeFalse();
  });

  it('PENDIENTE oculta el flujo viejo', () => {
    expect(gestionadoPorFlujoNuevo([convocatoriaEn('PENDIENTE')])).toBeTrue();
  });

  it('CALCULADO y CONGELADO ocultan el flujo viejo', () => {
    expect(gestionadoPorFlujoNuevo([convocatoriaEn('CALCULADO')])).toBeTrue();
    expect(gestionadoPorFlujoNuevo([convocatoriaEn('CONGELADO')])).toBeTrue();
  });

  it('solo RESUELTO_LEGACY: el flujo viejo sigue visible', () => {
    expect(gestionadoPorFlujoNuevo([convocatoriaEn('RESUELTO_LEGACY')])).toBeFalse();
  });

  it('mezcla de RESUELTO_LEGACY y otro estado: el flujo viejo se oculta', () => {
    expect(
      gestionadoPorFlujoNuevo([convocatoriaEn('RESUELTO_LEGACY'), convocatoriaEn('CALCULADO')]),
    ).toBeTrue();
  });
});
