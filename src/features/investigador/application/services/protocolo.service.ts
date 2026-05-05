import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CrearProtocoloDto, ProtocoloCreadoResponse, ProtocoloResumen, ProtocoloDetalle } from '../../domain/dtos/crear-protocolo.dto';

@Injectable({ providedIn: 'root' })
export class ProtocoloService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/protocolos`;

  crearProtocolo(formData: FormData): Observable<ProtocoloCreadoResponse> {
    return this.http.post<ProtocoloCreadoResponse>(this.API, formData).pipe(
      catchError(error => {
        console.error('Error creando protocolo:', error);
        return throwError(() => error);
      })
    );
  }

  misProtocolos(): Observable<ProtocoloResumen[]> {
    return this.http.get<ProtocoloResumen[]>(`${this.API}/mis-protocolos`);
  }

  obtenerProtocolo(codigo: string): Observable<ProtocoloDetalle> {
    return this.http.get<ProtocoloDetalle>(`${this.API}/${codigo}`);
  }
}
