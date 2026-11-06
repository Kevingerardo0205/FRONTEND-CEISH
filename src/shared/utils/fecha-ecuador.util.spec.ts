import {
  ZONA_ECUADOR,
  fechaCalendario,
  fechaEcuador,
  fechaHoraEcuador,
} from './fecha-ecuador.util';

describe('fecha-ecuador.util (F01 T01-1)', () => {
  describe('fechaCalendario', () => {
    it("'2026-11-04' → '04/11/2026' (se parte el texto: no se corre al día anterior)", () => {
      expect(fechaCalendario('2026-11-04')).toBe('04/11/2026');
    });

    it('primer y último día del año, y 29 de febrero bisiesto', () => {
      expect(fechaCalendario('2026-01-01')).toBe('01/01/2026');
      expect(fechaCalendario('2026-12-31')).toBe('31/12/2026');
      expect(fechaCalendario('2028-02-29')).toBe('29/02/2028');
    });

    it('texto inválido → null', () => {
      for (const texto of [
        '2026-13-01',
        '2026-00-10',
        '2026-02-30',
        '2026-02-29',
        '2026-11-00',
        '',
        '04/11/2026',
        '2026-11-4',
        '2026-11-04T00:00:00.000Z',
        ' 2026-11-04',
      ]) {
        expect(fechaCalendario(texto)).withContext(texto).toBeNull();
      }
      expect(fechaCalendario(null)).toBeNull();
      expect(fechaCalendario(undefined)).toBeNull();
    });
  });

  describe('fechaEcuador', () => {
    it("'2026-10-21T04:59:59.999Z' → '20/10/2026' (en Ecuador aún es el 20)", () => {
      expect(fechaEcuador('2026-10-21T04:59:59.999Z')).toBe('20/10/2026');
    });

    it("'2026-10-21T05:00:00.000Z' → '21/10/2026' (medianoche en Ecuador)", () => {
      expect(fechaEcuador('2026-10-21T05:00:00.000Z')).toBe('21/10/2026');
    });

    it('respeta el desfase que trae el ISO', () => {
      expect(fechaEcuador('2026-10-21T02:00:00+03:00')).toBe('20/10/2026');
    });

    it('ISO inválido → null', () => {
      for (const iso of ['abc', '', '   ', '2026-13-01T00:00:00Z']) {
        expect(fechaEcuador(iso)).withContext(iso).toBeNull();
      }
      expect(fechaEcuador(null)).toBeNull();
      expect(fechaEcuador(undefined)).toBeNull();
    });
  });

  describe('fechaHoraEcuador', () => {
    it("'2026-11-10T14:00:00.000Z' → '10/11/2026, 09:00'", () => {
      expect(fechaHoraEcuador('2026-11-10T14:00:00.000Z')).toBe('10/11/2026, 09:00');
    });

    it('24 horas: la tarde no se escribe en formato de 12 horas', () => {
      expect(fechaHoraEcuador('2026-11-10T20:30:00.000Z')).toBe('10/11/2026, 15:30');
    });

    it("medianoche en Ecuador → '00:00' del día siguiente", () => {
      expect(fechaHoraEcuador('2026-11-11T05:00:00.000Z')).toBe('11/11/2026, 00:00');
    });

    it('ISO inválido → null', () => {
      for (const iso of ['abc', '', '2026-11-10T25:00:00Z']) {
        expect(fechaHoraEcuador(iso)).withContext(iso).toBeNull();
      }
      expect(fechaHoraEcuador(null)).toBeNull();
    });
  });

  it('no depende de la zona del navegador: siempre formatea con timeZone America/Guayaquil', () => {
    const Original = Intl.DateTimeFormat;
    const opciones: (Intl.DateTimeFormatOptions | undefined)[] = [];
    // `function` (no flecha): el espía se invoca con `new`.
    spyOn(Intl, 'DateTimeFormat').and.callFake(function (
      locales?: string | string[],
      options?: Intl.DateTimeFormatOptions,
    ) {
      opciones.push(options);
      return new Original(locales, options);
    } as typeof Intl.DateTimeFormat);

    expect(fechaEcuador('2026-10-21T04:59:59.999Z')).toBe('20/10/2026');
    expect(fechaHoraEcuador('2026-11-10T14:00:00.000Z')).toBe('10/11/2026, 09:00');

    expect(opciones.length).toBe(2);
    for (const o of opciones) expect(o?.timeZone).toBe(ZONA_ECUADOR);
    expect(ZONA_ECUADOR).toBe('America/Guayaquil');
  });
});
