import { TestBed } from '@angular/core/testing';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { JwtInterceptor } from '@infrastructure/interceptors/jwt.interceptor';
import { TokenStoreAdapter } from '@infrastructure/storage/token-store.adapter';
import { ResolucionContextoAdapter } from './resolucion-contexto.adapter';

const CONV = '11111111-1111-4111-8111-111111111111';
const CP = '22222222-2222-4222-8222-222222222222';
const URL_S3 = 'https://storage.example.test/bucket/cartas/clave.pdf?X-Amz-Signature=abc';

describe('ResolucionContextoAdapter', () => {
  let adapter: ResolucionContextoAdapter;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        // El interceptor sí tiene token: el adaptador debe usarlo para la API y no para S3.
        { provide: TokenStoreAdapter, useValue: { getToken: () => 'token-de-prueba' } },
      ],
    });
    adapter = TestBed.inject(ResolucionContextoAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtenerContexto: GET contexto y desenvuelve data', () => {
    let recibido: unknown;
    adapter.obtenerContexto('7').subscribe((v) => (recibido = v));

    const req = http.expectOne('/api/resolutions/protocol/7/contexto');
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        {
          convocatoriaId: CONV,
          convocatoriaProtocoloId: CP,
          numeroConvocatoria: 'C-2026-01',
          fechaReunion: null,
          versionEvaluada: 1,
          resultado: null,
          anexoEsperado: null,
          cartaVigente: null,
          puedeSubirCarta: false,
          estadoResultado: 'PENDIENTE',
          resultadoCalculado: null,
          resolucionAnterior: null,
          resueltoEnConvocatoria: null,
        },
      ],
    });
    expect(recibido).toEqual([
      jasmine.objectContaining({ numeroConvocatoria: 'C-2026-01', estadoResultado: 'PENDIENTE', cartaVigente: null }),
    ]);
  });

  it('obtenerContexto: la API sí recibe el token de la sesión', () => {
    adapter.obtenerContexto('7').subscribe();
    const req = http.expectOne('/api/resolutions/protocol/7/contexto');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    req.flush([]);
  });

  it('solicitarSubida: POST upload-url con cuerpo vacío (sin anexoCodigo) y devuelve la subida', () => {
    let recibido: unknown;
    adapter.solicitarSubida(CONV, CP).subscribe((v) => (recibido = v));
    const req = http.expectOne(`/api/resolutions/convocatorias/${CONV}/protocolos/${CP}/cartas/upload-url`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({
      data: { uploadUrl: URL_S3, claveArchivo: 'cartas/7/v1/x.pdf', anexoCodigo: 'ANEXO_14', numeroVersion: 1 },
    });
    expect(recibido).toEqual({
      uploadUrl: URL_S3,
      claveArchivo: 'cartas/7/v1/x.pdf',
      anexoCodigo: 'ANEXO_14',
      numeroVersion: 1,
    });
  });

  it('subirArchivo: PUT a la URL firmada con application/pdf y SIN Authorization', () => {
    const archivo = new File(['%PDF-1.4'], 'carta.pdf', { type: 'application/pdf' });
    let completado = false;
    adapter.subirArchivo(URL_S3, archivo).subscribe({ complete: () => (completado = true) });

    const req = http.expectOne(URL_S3);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Content-Type')).toBe('application/pdf');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(req.request.body).toBe(archivo);
    req.flush('');
    expect(completado).toBeTrue();
  });

  it('subirArchivo: un error de S3 se propaga como error', () => {
    const archivo = new File(['%PDF-1.4'], 'carta.pdf', { type: 'application/pdf' });
    let errorStatus: number | undefined;
    adapter.subirArchivo(URL_S3, archivo).subscribe({ error: (e) => (errorStatus = e.status) });
    http.expectOne(URL_S3).flush('', { status: 403, statusText: 'Forbidden' });
    expect(errorStatus).toBe(403);
  });

  it('registrarCarta: POST cartas con claveArchivo y motivo, sin anexoCodigo', () => {
    adapter
      .registrarCarta(CONV, CP, {
        claveArchivo: 'cartas/7/v2/y.pdf',
        motivoReemplazo: 'Corrección de firma.',
      })
      .subscribe();
    const req = http.expectOne(`/api/resolutions/convocatorias/${CONV}/protocolos/${CP}/cartas`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      claveArchivo: 'cartas/7/v2/y.pdf',
      motivoReemplazo: 'Corrección de firma.',
    });
    expect('anexoCodigo' in req.request.body).toBeFalse();
    req.flush({ data: {} });
  });

  it('listarCartas: GET cartas y devuelve el historial', () => {
    let recibido: unknown[] = [];
    adapter.listarCartas(CONV, CP).subscribe((v) => (recibido = v));
    const req = http.expectOne(`/api/resolutions/convocatorias/${CONV}/protocolos/${CP}/cartas`);
    req.flush({
      data: [{ id: 'a', numeroVersion: 1, resultado: 'NO_APROBADO', anexoCodigo: 'ANEXO_13', vigente: true, subidoEn: '2026-11-21T10:00:00.000Z' }],
    });
    expect(recibido.length).toBe(1);
  });

  it('urlDescargaCarta: POST storage/download-url con la clave y devuelve downloadUrl', () => {
    let url = '';
    adapter.urlDescargaCarta('cartas/7/v1/clave.pdf').subscribe((v) => (url = v));
    const req = http.expectOne('/api/storage/download-url');
    expect(req.request.body).toEqual({ key: 'cartas/7/v1/clave.pdf' });
    req.flush({ data: { downloadUrl: URL_S3 } });
    expect(url).toBe(URL_S3);
  });
});
