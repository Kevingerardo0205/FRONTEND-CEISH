import { numeroVersionProtocolo, puedeSubirDocumentoSubsanacion } from './subsanacion-upload.rules';

describe('numeroVersionProtocolo', () => {
  it('lee «N.0», N y valores no legibles', () => {
    expect(numeroVersionProtocolo('1.0')).toBe(1);
    expect(numeroVersionProtocolo('2.0')).toBe(2);
    expect(numeroVersionProtocolo(3)).toBe(3);
    expect(numeroVersionProtocolo(undefined)).toBeNull();
    expect(numeroVersionProtocolo('x')).toBeNull();
    expect(numeroVersionProtocolo(0)).toBeNull();
  });
});

describe('puedeSubirDocumentoSubsanacion (TSK-015-N24)', () => {
  describe('versión 1', () => {
    it('permite en BORRADOR (INICIADO)', () => {
      expect(
        puedeSubirDocumentoSubsanacion({ statusId: 9, receptionStatus: 'BORRADOR', version: '1.0' }),
      ).toBeTrue();
    });

    it('permite en subsanación documental (agrupada en PENDIENTE_SUBSANACION)', () => {
      expect(
        puedeSubirDocumentoSubsanacion({
          statusId: 20,
          receptionStatus: 'PENDIENTE_SUBSANACION',
          version: '1.0',
        }),
      ).toBeTrue();
    });

    it('no permite en recepción completa, incompleta, en revisión o archivada', () => {
      for (const receptionStatus of ['COMPLETO', 'INCOMPLETO', 'EN_REVISION_SECRETARIA', 'ARCHIVADO']) {
        expect(
          puedeSubirDocumentoSubsanacion({ statusId: 10, receptionStatus, version: '1.0' }),
        ).withContext(receptionStatus).toBeFalse();
      }
    });

    it('no permite sin estado de recepción (no se asume BORRADOR)', () => {
      expect(
        puedeSubirDocumentoSubsanacion({ statusId: 9, receptionStatus: undefined, version: '1.0' }),
      ).toBeFalse();
    });
  });

  describe('versión mayor que 1', () => {
    it('permite con protocolo en 19 y recepción en subsanación', () => {
      expect(
        puedeSubirDocumentoSubsanacion({
          statusId: 19,
          receptionStatus: 'EVALUACION_SUBSANACIONES',
          version: '2.0',
        }),
      ).toBeTrue();
    });

    it('permite con protocolo en 21 y recepción en subsanación', () => {
      expect(
        puedeSubirDocumentoSubsanacion({
          statusId: 21,
          receptionStatus: 'EVALUACION_SUBSANACIONES',
          version: '3.0',
        }),
      ).toBeTrue();
    });

    it('no permite si el protocolo no está en 19 ni 21', () => {
      expect(
        puedeSubirDocumentoSubsanacion({
          statusId: 17,
          receptionStatus: 'EVALUACION_SUBSANACIONES',
          version: '2.0',
        }),
      ).toBeFalse();
    });

    it('no permite si la recepción no está en subsanación', () => {
      expect(
        puedeSubirDocumentoSubsanacion({ statusId: 19, receptionStatus: 'COMPLETO', version: '2.0' }),
      ).toBeFalse();
    });
  });

  it('no permite sin versión legible', () => {
    expect(
      puedeSubirDocumentoSubsanacion({ statusId: 9, receptionStatus: 'BORRADOR', version: undefined }),
    ).toBeFalse();
  });
});
