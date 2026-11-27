import {
  ConvocatoriaApi,
  MENSAJE_INESPERADO,
  MENSAJE_SIN_CONEXION,
  MENSAJE_SIN_PERMISO,
  desenvolver,
  mapConvocatoriasContexto,
  mensajeDeErrorResolucion,
} from './resolucion-contexto.mapper';
import { ValidacionResolucionError } from '@domain/entities/resolucion-contexto.entity';

const convocatoriaBase: ConvocatoriaApi = {
  convocatoriaId: '11111111-1111-4111-8111-111111111111',
  convocatoriaProtocoloId: '22222222-2222-4222-8222-222222222222',
  numeroConvocatoria: 'C-2026-01',
  fechaReunion: '2026-11-20T15:00:00.000Z',
  versionEvaluada: 2,
  resultado: 'APROBADO_CON_CONDICION',
  anexoEsperado: 'ANEXO_13',
  cartaVigente: {
    numeroVersion: 1,
    anexoCodigo: 'ANEXO_13',
    subidoEn: '2026-11-21T10:00:00.000Z',
    claveArchivo: 'cartas/7/v1/clave.pdf',
  },
  puedeRegistrarResultado: false,
  puedeSubirCarta: true,
};

describe('mapConvocatoriasContexto', () => {
  it('copia la lista en el mismo orden y conserva los flags del backend', () => {
    const segunda: ConvocatoriaApi = { ...convocatoriaBase, convocatoriaId: 'otra', numeroConvocatoria: 'C-2025-09' };
    const resultado = mapConvocatoriasContexto([convocatoriaBase, segunda]);

    expect(resultado.map((c) => c.numeroConvocatoria)).toEqual(['C-2026-01', 'C-2025-09']);
    expect(resultado[0].puedeSubirCarta).toBeTrue();
    expect(resultado[0].puedeRegistrarResultado).toBeFalse();
    expect(resultado[0].cartaVigente?.claveArchivo).toBe('cartas/7/v1/clave.pdf');
  });

  it('sin carta vigente devuelve cartaVigente null', () => {
    const [c] = mapConvocatoriasContexto([{ ...convocatoriaBase, cartaVigente: null, anexoEsperado: null }]);
    expect(c.cartaVigente).toBeNull();
    expect(c.anexoEsperado).toBeNull();
  });

  it('motivo y observaciones solo existen si el backend los envía', () => {
    const sinCampos = mapConvocatoriasContexto([convocatoriaBase])[0];
    expect('motivo' in sinCampos).toBeFalse();
    expect('observaciones' in sinCampos).toBeFalse();

    const conCampos = mapConvocatoriasContexto([
      { ...convocatoriaBase, motivo: null, observaciones: 'Revisar anexo' },
    ])[0];
    expect(conCampos.motivo).toBeNull();
    expect(conCampos.observaciones).toBe('Revisar anexo');
  });

  it('no inventa valores: un flag ausente queda en false', () => {
    const raw = { ...convocatoriaBase } as Partial<ConvocatoriaApi>;
    delete raw.puedeSubirCarta;
    const [c] = mapConvocatoriasContexto([raw as ConvocatoriaApi]);
    expect(c.puedeSubirCarta).toBeFalse();
  });

  it('lista vacía devuelve lista vacía', () => {
    expect(mapConvocatoriasContexto([])).toEqual([]);
  });
});

describe('desenvolver', () => {
  it('quita la envoltura data cuando existe', () => {
    expect(desenvolver<number[]>({ data: [1, 2] })).toEqual([1, 2]);
  });

  it('devuelve el cuerpo tal cual si no hay envoltura', () => {
    expect(desenvolver<number[]>([3])).toEqual([3]);
  });
});

describe('mensajeDeErrorResolucion', () => {
  it('400, 404 y 409 muestran el texto del backend tal cual', () => {
    expect(mensajeDeErrorResolucion({ status: 404, error: { message: 'Protocolo no encontrado.' } })).toBe(
      'Protocolo no encontrado.',
    );
    expect(mensajeDeErrorResolucion({ status: 400, error: { message: 'ID de protocolo inválido' } })).toBe(
      'ID de protocolo inválido',
    );
    expect(
      mensajeDeErrorResolucion({ status: 409, error: { message: ['Primera línea.', 'Segunda línea.'] } }),
    ).toBe('Primera línea. Segunda línea.');
  });

  it('403 usa el mensaje de permiso, sin importar el cuerpo', () => {
    expect(mensajeDeErrorResolucion({ status: 403, error: { message: 'Forbidden resource' } })).toBe(
      MENSAJE_SIN_PERMISO,
    );
  });

  it('status 0 es error de red con mensaje propio', () => {
    expect(mensajeDeErrorResolucion({ status: 0 })).toBe(MENSAJE_SIN_CONEXION);
  });

  it('un 500 o un cuerpo sin mensaje cae al mensaje genérico', () => {
    expect(mensajeDeErrorResolucion({ status: 500, error: { message: 'stack interno' } })).toBe(MENSAJE_INESPERADO);
    expect(mensajeDeErrorResolucion({ status: 400, error: {} })).toBe(MENSAJE_INESPERADO);
    expect(mensajeDeErrorResolucion(null)).toBe(MENSAJE_INESPERADO);
  });

  it('un error de validación de ayuda muestra su propio mensaje', () => {
    expect(mensajeDeErrorResolucion(new ValidacionResolucionError('Solo se admiten archivos PDF.'))).toBe(
      'Solo se admiten archivos PDF.',
    );
  });
});
