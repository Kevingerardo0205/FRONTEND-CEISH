import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { IResolucionContextoPort } from '@domain/ports/IResolucionContextoPort';
import { ValidacionResolucionError } from '@domain/entities/resolucion-contexto.entity';
import {
  SubirCartaEntrada,
  SubirCartaFirmadaUseCase,
  TAMANO_MAXIMO_CARTA_BYTES,
  validarArchivoCarta,
} from './subir-carta-firmada.use-case';

const CONV = '11111111-1111-4111-8111-111111111111';
const CP = '22222222-2222-4222-8222-222222222222';

function pdf(nombre = 'carta.pdf', tamano = 1024): File {
  const archivo = new File(['x'], nombre, { type: 'application/pdf' });
  Object.defineProperty(archivo, 'size', { value: tamano });
  return archivo;
}

function entrada(overrides: Partial<SubirCartaEntrada> = {}): SubirCartaEntrada {
  return {
    convocatoriaId: CONV,
    convocatoriaProtocoloId: CP,
    anexoEsperado: 'ANEXO_13',
    archivo: pdf(),
    hayCartaVigente: false,
    ...overrides,
  };
}

describe('validarArchivoCarta', () => {
  it('acepta PDF de hasta 10 MB exactos', () => {
    expect(validarArchivoCarta(pdf('a.pdf', TAMANO_MAXIMO_CARTA_BYTES))).toBeNull();
  });

  it('rechaza lo que no es PDF', () => {
    const png = new File(['x'], 'firma.png', { type: 'image/png' });
    expect(validarArchivoCarta(png)).toBe('Solo se admiten archivos PDF.');
  });

  it('acepta un archivo sin tipo MIME si la extensión es .pdf', () => {
    const sinTipo = new File(['x'], 'carta.PDF', { type: '' });
    expect(validarArchivoCarta(sinTipo)).toBeNull();
  });

  it('rechaza más de 10 MB', () => {
    expect(validarArchivoCarta(pdf('grande.pdf', TAMANO_MAXIMO_CARTA_BYTES + 1))).toBe(
      'El archivo no puede superar 10 MB.',
    );
  });
});

describe('SubirCartaFirmadaUseCase', () => {
  let useCase: SubirCartaFirmadaUseCase;
  let port: jasmine.SpyObj<IResolucionContextoPort>;

  beforeEach(() => {
    port = jasmine.createSpyObj<IResolucionContextoPort>('IResolucionContextoPort', [
      'solicitarSubida',
      'subirArchivo',
      'registrarCarta',
    ]);
    port.solicitarSubida.and.returnValue(
      of({ uploadUrl: 'https://s3/x', claveArchivo: 'cartas/7/v1/x.pdf', anexoCodigo: 'ANEXO_13', numeroVersion: 1 }),
    );
    port.subirArchivo.and.returnValue(of(undefined));
    port.registrarCarta.and.returnValue(of(undefined));

    TestBed.configureTestingModule({ providers: [{ provide: IResolucionContextoPort, useValue: port }] });
    useCase = TestBed.inject(SubirCartaFirmadaUseCase);
  });

  it('ejecuta upload-url, PUT y registro, en ese orden, con la clave emitida', () => {
    const orden: string[] = [];
    port.solicitarSubida.and.callFake(() => {
      orden.push('upload-url');
      return of({ uploadUrl: 'https://s3/x', claveArchivo: 'cartas/7/v1/x.pdf', anexoCodigo: 'ANEXO_13', numeroVersion: 1 });
    });
    port.subirArchivo.and.callFake(() => {
      orden.push('put');
      return of(undefined);
    });
    port.registrarCarta.and.callFake(() => {
      orden.push('registro');
      return of(undefined);
    });

    useCase.execute(entrada()).subscribe();

    expect(orden).toEqual(['upload-url', 'put', 'registro']);
    expect(port.subirArchivo).toHaveBeenCalledWith('https://s3/x', jasmine.any(File));
    expect(port.registrarCarta).toHaveBeenCalledWith(CONV, CP, {
      claveArchivo: 'cartas/7/v1/x.pdf',
      anexoCodigo: 'ANEXO_13',
    });
  });

  it('usa anexoEsperado y no envía motivo si no hay carta vigente', () => {
    useCase.execute(entrada({ anexoEsperado: 'ANEXO_15' })).subscribe();
    expect(port.solicitarSubida).toHaveBeenCalledWith(CONV, CP, 'ANEXO_15');
    const cuerpo = port.registrarCarta.calls.mostRecent().args[2];
    expect('motivoReemplazo' in cuerpo).toBeFalse();
  });

  it('con carta vigente envía el motivo de reemplazo', () => {
    useCase.execute(entrada({ hayCartaVigente: true, motivoReemplazo: '  Firma nueva  ' })).subscribe();
    expect(port.registrarCarta).toHaveBeenCalledWith(CONV, CP, {
      claveArchivo: 'cartas/7/v1/x.pdf',
      anexoCodigo: 'ANEXO_13',
      motivoReemplazo: 'Firma nueva',
    });
  });

  it('con carta vigente y sin motivo no llama a nada', () => {
    let error: unknown;
    useCase.execute(entrada({ hayCartaVigente: true, motivoReemplazo: '   ' })).subscribe({ error: (e) => (error = e) });
    expect(error).toEqual(jasmine.any(ValidacionResolucionError));
    expect(port.solicitarSubida).not.toHaveBeenCalled();
    expect(port.subirArchivo).not.toHaveBeenCalled();
    expect(port.registrarCarta).not.toHaveBeenCalled();
  });

  it('no-PDF corta antes de cualquier llamada', () => {
    let mensaje = '';
    useCase
      .execute(entrada({ archivo: new File(['x'], 'a.docx', { type: 'application/msword' }) }))
      .subscribe({ error: (e: Error) => (mensaje = e.message) });
    expect(mensaje).toBe('Solo se admiten archivos PDF.');
    expect(port.solicitarSubida).not.toHaveBeenCalled();
  });

  it('más de 10 MB corta antes de cualquier llamada', () => {
    let mensaje = '';
    useCase
      .execute(entrada({ archivo: pdf('grande.pdf', TAMANO_MAXIMO_CARTA_BYTES + 1) }))
      .subscribe({ error: (e: Error) => (mensaje = e.message) });
    expect(mensaje).toBe('El archivo no puede superar 10 MB.');
    expect(port.solicitarSubida).not.toHaveBeenCalled();
  });

  it('si upload-url falla no hace el PUT ni el registro', () => {
    port.solicitarSubida.and.returnValue(throwError(() => ({ status: 409 })));
    let error: unknown;
    useCase.execute(entrada()).subscribe({ error: (e) => (error = e) });
    expect(error).toEqual({ status: 409 });
    expect(port.subirArchivo).not.toHaveBeenCalled();
    expect(port.registrarCarta).not.toHaveBeenCalled();
  });

  it('si el PUT falla no registra la carta', () => {
    port.subirArchivo.and.returnValue(throwError(() => ({ status: 0 })));
    let error: unknown;
    useCase.execute(entrada()).subscribe({ error: (e) => (error = e) });
    expect(error).toEqual({ status: 0 });
    expect(port.registrarCarta).not.toHaveBeenCalled();
  });

  it('si el registro falla, el error llega al llamador', () => {
    port.registrarCarta.and.returnValue(throwError(() => ({ status: 400 })));
    let error: unknown;
    useCase.execute(entrada()).subscribe({ error: (e) => (error = e) });
    expect(error).toEqual({ status: 400 });
  });
});
