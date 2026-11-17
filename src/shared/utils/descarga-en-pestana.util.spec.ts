import { defer, EMPTY, NEVER, Observable, of, Subject, throwError } from 'rxjs';
import {
  abrirEnPestana,
  esUrlDeDescargaValida,
  ResultadoDescarga,
} from './descarga-en-pestana.util';

describe('descarga-en-pestana.util (F09 D28, F08 D6)', () => {
  const URL_BUENA = 'https://zz-test.invalid/formatos/zz-test.docx';

  interface PestanaFalsa {
    opener: unknown;
    location: { href: string };
    close: jasmine.Spy;
  }

  let orden: string[];
  let pestana: PestanaFalsa;
  let abrirSpy: jasmine.Spy;

  beforeEach(() => {
    orden = [];
    pestana = { opener: {}, location: { href: '' }, close: jasmine.createSpy('close') };
    abrirSpy = spyOn(window, 'open').and.callFake(() => {
      orden.push('abrir');
      return pestana as unknown as Window;
    });
  });

  /** La petición se cuenta al llamar a la fábrica y al suscribirse. */
  function peticion<T>(respuesta: Observable<T>): () => Observable<T> {
    return () => {
      orden.push('pedir');
      return defer(() => respuesta);
    };
  }

  function resultadoDe(respuesta: Observable<{ downloadUrl?: unknown }>): ResultadoDescarga[] {
    const resultados: ResultadoDescarga[] = [];
    abrirEnPestana(() => respuesta).subscribe((r) => resultados.push(r));
    return resultados;
  }

  describe('esUrlDeDescargaValida', () => {
    it('acepta https y http solo con localhost o 127.0.0.1', () => {
      expect(esUrlDeDescargaValida(URL_BUENA)).toBeTrue();
      expect(esUrlDeDescargaValida('http://localhost:9000/zz-test.docx')).toBeTrue();
      expect(esUrlDeDescargaValida('http://127.0.0.1/zz-test.docx')).toBeTrue();
    });

    it('rechaza http externo, javascript:, vacío, texto que no es URL y lo que no es texto', () => {
      for (const url of [
        'http://zz-test.invalid/zz-test.docx',
        'javascript:alert(1)',
        'data:text/html,zz',
        '',
        '   ',
        'no es una url',
        undefined,
        null,
        42,
      ]) {
        expect(esUrlDeDescargaValida(url)).withContext(String(url)).toBeFalse();
      }
    });
  });

  describe('abrirEnPestana', () => {
    it('abre la pestaña antes de pedir la URL, sin opener, y la lleva a la URL buena', () => {
      const respuesta$ = new Subject<{ downloadUrl: string }>();
      const resultados: ResultadoDescarga[] = [];
      abrirEnPestana(peticion(respuesta$)).subscribe((r) => resultados.push(r));

      expect(orden).toEqual(['abrir', 'pedir']);
      expect(abrirSpy).toHaveBeenCalledOnceWith('', '_blank');
      expect(pestana.opener).toBeNull();
      expect(pestana.location.href).toBe('');
      expect(resultados).toEqual([]);

      respuesta$.next({ downloadUrl: URL_BUENA });

      expect(pestana.location.href).toBe(URL_BUENA);
      expect(pestana.close).not.toHaveBeenCalled();
      expect(resultados).toEqual(['abierta']);
    });

    it('cada suscripción vuelve a pedir la URL', () => {
      const pedir = peticion(of({ downloadUrl: URL_BUENA }));
      abrirEnPestana(pedir).subscribe();
      abrirEnPestana(pedir).subscribe();
      expect(orden).toEqual(['abrir', 'pedir', 'abrir', 'pedir']);
    });

    it('si el navegador no abre la pestaña: bloqueada y no se pide la URL', () => {
      abrirSpy.and.returnValue(null);
      const resultados: ResultadoDescarga[] = [];
      abrirEnPestana(peticion(of({ downloadUrl: URL_BUENA }))).subscribe((r) => resultados.push(r));
      expect(resultados).toEqual(['bloqueada']);
      expect(orden).toEqual([]);
    });

    it('URL que no pasa la comprobación: cierra la pestaña y devuelve error', () => {
      for (const respuesta of [
        { downloadUrl: 'http://zz-test.invalid/zz-test.docx' },
        { downloadUrl: 'javascript:alert(1)' },
        {},
      ]) {
        pestana.close.calls.reset();
        expect(resultadoDe(of(respuesta))).withContext(JSON.stringify(respuesta)).toEqual(['error']);
        expect(pestana.close).toHaveBeenCalledTimes(1);
        expect(pestana.location.href).toBe('');
      }
    });

    it('404 → no-disponible; 500 y 0 → error; las tres cierran la pestaña', () => {
      for (const [status, esperado] of [
        [404, 'no-disponible'],
        [500, 'error'],
        [0, 'error'],
      ] as const) {
        pestana.close.calls.reset();
        expect(resultadoDe(throwError(() => ({ status })))).withContext(String(status)).toEqual([
          esperado,
        ]);
        expect(pestana.close).toHaveBeenCalledTimes(1);
      }
    });

    it('si la petición termina sin respuesta: cierra la pestaña y devuelve error', () => {
      expect(resultadoDe(EMPTY)).toEqual(['error']);
      expect(pestana.close).toHaveBeenCalledTimes(1);
    });

    it('si se cancela antes de la respuesta: cierra la pestaña vacía y no emite', () => {
      const resultados: ResultadoDescarga[] = [];
      const sub = abrirEnPestana(() => NEVER).subscribe((r) => resultados.push(r));
      expect(pestana.close).not.toHaveBeenCalled();

      sub.unsubscribe();

      expect(pestana.close).toHaveBeenCalledTimes(1);
      expect(resultados).toEqual([]);
    });
  });
});
