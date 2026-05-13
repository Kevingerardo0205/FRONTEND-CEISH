import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';

@Injectable({
  providedIn: 'root'
})
export class ProtocolMockAdapter extends IProtocolRepositoryPort {
  private protocols: ProtocolEntity[] = [
    {
      id: '1',
      title: 'Prevalencia de parasitosis intestinal mediante técnicas coproparasitológicas en niños y adolescentes de 5 a 18 años de la parroquia Punín, provincia de Chimborazo',
      investigatorId: 'inv-123',
      type: ProtocolType.IO,
      status: ProtocolStatus.SUBMITTED,
      submissionDate: new Date(),
      code: 'IO-01-CEISH-ESPOCH-2026',
      documents: [],
      version: 1
    },
    {
      id: '2',
      title: 'Estudio comparativo de la eficacia de dos protocolos de rehabilitación post-infarto',
      investigatorId: 'inv-456',
      type: ProtocolType.EC,
      status: ProtocolStatus.SUBMITTED,
      submissionDate: new Date(),
      documents: [],
      version: 1
    }
  ];

  getAll(): Observable<ProtocolEntity[]> {
    return of(this.protocols);
  }

  save(protocol: Partial<ProtocolEntity>): Observable<ProtocolEntity> {
    const index = this.protocols.findIndex(p => p.id === protocol.id);
    if (index !== -1) {
      this.protocols[index] = { ...this.protocols[index], ...protocol } as ProtocolEntity;
      return of(this.protocols[index]);
    }
    const newProtocol = { ...protocol, id: Math.random().toString() } as ProtocolEntity;
    this.protocols.push(newProtocol);
    return of(newProtocol);
  }

  getById(id: string): Observable<ProtocolEntity> {
    const protocol = this.protocols.find(p => p.id === id);
    if (!protocol) throw new Error('Protocolo no encontrado');
    return of(protocol);
  }

  uploadDocuments(protocolId: string, files: File[]): Observable<ProtocolEntity> {
    return this.getById(protocolId);
  }

  getRequirementsByType(type: ProtocolType): Observable<string[]> {
    return of(['Req 1', 'Req 2']);
  }

  getChecklist(id: string): Observable<any> {
    const protocol = this.protocols.find(p => p.id === id);
    return of({
      protocol: protocol,
      documents: [
        { id: 'doc-1', documentTypeId: 1, documentType: { name: 'Anexo 1', description: 'Formulario de solicitud' }, status: 'PENDIENTE', isOptional: false },
        { id: 'doc-2', documentTypeId: 2, documentType: { name: 'CV Investigador', description: 'Hoja de vida' }, status: 'PENDIENTE', isOptional: false }
      ]
    });
  }

  finalizeReception(id: string): Observable<any> {
    return of({ ceishCode: `CEISH-MOCK-${id}`, message: 'Recepción finalizada mock' });
  }

  getCertificate(id: string): Observable<Blob> {
    return of(new Blob(['Mock Certificate Content'], { type: 'application/pdf' }));
  }

  finalizeValidation(protocolId: string): Observable<any> {
    const index = this.protocols.findIndex(p => p.id === protocolId);
    if (index !== -1) {
      this.protocols[index].status = ProtocolStatus.VALIDATED;
      return of({ message: 'Validación finalizada con éxito' });
    }
    throw new Error('Protocolo no encontrado');
  }
}
