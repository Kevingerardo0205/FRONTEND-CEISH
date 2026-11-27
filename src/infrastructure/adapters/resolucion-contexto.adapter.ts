import { Injectable, inject } from '@angular/core';
import {
  HttpBackend,
  HttpClient,
  HttpEventType,
  HttpHeaders,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  AnexoCarta,
  CartaVersion,
  ConvocatoriaContexto,
  RegistrarCartaBody,
  RegistrarResultadoBody,
  SubidaCarta,
} from '@domain/entities/resolucion-contexto.entity';
import { IResolucionContextoPort } from '@domain/ports/IResolucionContextoPort';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';
import {
  ConvocatoriaApi,
  desenvolver,
  mapConvocatoriasContexto,
  mapHistorialCartas,
  mapSubidaCarta,
} from '@infrastructure/mappers/resolucion-contexto.mapper';

const CONTENT_TYPE_PDF = 'application/pdf';

@Injectable({ providedIn: 'root' })
export class ResolucionContextoAdapter extends IResolucionContextoPort {
  private readonly api = inject(ApiClientService);
  /**
   * Cliente sin interceptores: la URL firmada de S3 no debe llevar el token de la sesión.
   * HttpBackend salta la cadena de interceptores (JwtInterceptor incluido).
   */
  private readonly rawHttp = new HttpClient(inject(HttpBackend));

  obtenerContexto(protocolId: string): Observable<ConvocatoriaContexto[]> {
    return this.api
      .get<{ data?: ConvocatoriaApi[] } | ConvocatoriaApi[]>(ENDPOINTS.RESOLUTIONS.CONTEXTO(protocolId))
      .pipe(map((res) => mapConvocatoriasContexto(desenvolver<ConvocatoriaApi[]>(res))));
  }

  registrarResultado(
    convocatoriaId: string,
    convocatoriaProtocoloId: string,
    cuerpo: RegistrarResultadoBody,
  ): Observable<void> {
    return this.api
      .patch<unknown>(ENDPOINTS.MEETINGS.RESULTADO(convocatoriaId, convocatoriaProtocoloId), cuerpo)
      .pipe(map(() => undefined));
  }

  solicitarSubida(
    convocatoriaId: string,
    convocatoriaProtocoloId: string,
    anexoCodigo: AnexoCarta,
  ): Observable<SubidaCarta> {
    return this.api
      .post<{ data?: SubidaCarta } | SubidaCarta>(
        `${ENDPOINTS.RESOLUTIONS.CARTAS(convocatoriaId, convocatoriaProtocoloId)}/upload-url`,
        { anexoCodigo },
      )
      .pipe(map((res) => mapSubidaCarta(desenvolver<SubidaCarta>(res))));
  }

  subirArchivo(uploadUrl: string, archivo: File): Observable<void> {
    const req = new HttpRequest('PUT', uploadUrl, archivo, {
      headers: new HttpHeaders({ 'Content-Type': CONTENT_TYPE_PDF }),
      responseType: 'text',
      reportProgress: false,
    });
    return this.rawHttp.request(req).pipe(
      filter((evento) => evento.type === HttpEventType.Response),
      map(() => undefined),
    );
  }

  registrarCarta(
    convocatoriaId: string,
    convocatoriaProtocoloId: string,
    cuerpo: RegistrarCartaBody,
  ): Observable<void> {
    return this.api
      .post<unknown>(ENDPOINTS.RESOLUTIONS.CARTAS(convocatoriaId, convocatoriaProtocoloId), cuerpo)
      .pipe(map(() => undefined));
  }

  listarCartas(convocatoriaId: string, convocatoriaProtocoloId: string): Observable<CartaVersion[]> {
    return this.api
      .get<{ data?: CartaVersion[] } | CartaVersion[]>(
        ENDPOINTS.RESOLUTIONS.CARTAS(convocatoriaId, convocatoriaProtocoloId),
      )
      .pipe(map((res) => mapHistorialCartas(desenvolver<CartaVersion[]>(res))));
  }

  urlDescargaCarta(claveArchivo: string): Observable<string> {
    return this.api
      .post<{ data?: { downloadUrl: string } } | { downloadUrl: string }>(
        ENDPOINTS.AI_ASSISTANT_ADMIN.STORAGE.DOWNLOAD_URL,
        { key: claveArchivo },
      )
      .pipe(map((res) => desenvolver<{ downloadUrl: string }>(res).downloadUrl));
  }
}
