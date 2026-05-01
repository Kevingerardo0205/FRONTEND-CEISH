import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { ValidationContext } from '../../strategies/validation-context';

@Injectable({
  providedIn: 'root'
})
export class SubmitProtocolUseCase {
  private repository = inject(IProtocolRepositoryPort);
  private validationContext = new ValidationContext();

  execute(protocol: Partial<ProtocolEntity>, files: File[]): Observable<ProtocolEntity> {
    if (!protocol.type) return throwError(() => new Error('El tipo de protocolo es requerido'));

    // 1. Validar documentos según PET 2023
    const strategy = this.validationContext.getStrategy(protocol.type);
    
    // Mapeamos los archivos a tipos para la estrategia (simulación simplificada)
    const fileTypes = files.map(f => ({ type: (f as any).docType || 'UNKNOWN' }));
    const validation = strategy.validate(fileTypes);

    if (!validation.isValid) {
      return throwError(() => new Error(`Documentación incompleta: ${validation.missing.join(', ')}`));
    }

    // 2. Guardar datos iniciales
    return this.repository.save({
      ...protocol,
      status: ProtocolStatus.PENDING_VALIDATION,
      submissionDate: new Date()
    }).pipe(
      // 3. Subir documentos masivos (HU-002)
      switchMap(savedProtocol => 
        this.repository.uploadDocuments(savedProtocol.id, files)
      )
    );
  }
}
