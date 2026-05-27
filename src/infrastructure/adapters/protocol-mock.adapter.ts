import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity, ValidationDetailResponse } from '@domain/entities/protocol.entity';
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
      principalInvestigator: 'Juan Pérez',
      type: ProtocolType.IO,
      studyTypeCode: 'IO',
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
      principalInvestigator: 'María López',
      type: ProtocolType.EC,
      studyTypeCode: 'EC',
      status: ProtocolStatus.SUBMITTED,
      submissionDate: new Date(),
      documents: [],
      version: 1
    }
  ];

  getAll(): Observable<ProtocolEntity[]> {
    return of(this.protocols);
  }

  getReceptionProtocols(): Observable<ProtocolEntity[]> {
    return of(this.protocols);
  }

  getProtocolsByStatus(status: string, params?: { page?: number, limit?: number }): Observable<any> {
    const filtered = this.protocols.filter(p => p.status === status || (status === 'EN_REVISION_SECRETARIA' && p.status === ProtocolStatus.SUBMITTED));
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return of({
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit)
    });
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

  getDocumentHistory(id: string): Observable<any[]> {
    return of([]);
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

  updateRequirementStatus(protocolId: string, reqId: string, status: string): Observable<any> {
    console.log(`[ProtocolMockAdapter] Actualizando requisito ${reqId} a ${status} para protocolo ${protocolId}`);
    return of({ message: 'Estado de requisito actualizado exitosamente (Mock)' });
  }

  verifyProtocol(protocolId: string, isComplete: boolean, missingItemsList: string): Observable<any> {
    console.log(`[ProtocolMockAdapter] Verificando protocolo ${protocolId}: complete=${isComplete}, missing=${missingItemsList}`);
    return of({ message: 'Verificación de protocolo guardada exitosamente (Mock)' });
  }

  getValidationDetail(id: string): Observable<ValidationDetailResponse> {
    const protocol = this.protocols.find(p => p.id === id);
    return of({
      header: {
        id: Number(id),
        ceishCode: protocol?.code || 'TRÁMITE EN PROCESO',
        title: protocol?.title || 'Sin título',
        submissionDate: new Date().toISOString(),
        investigator: protocol?.principalInvestigator || 'Investigador Mock',
        studyType: 'Estudio Observacional'
      },
      checklist: [
        {
          id: 1,
          code: 'ANX-1',
          name: 'Solicitud de evaluación del protocolo (Anexo 1)',
          status: 'PRESENTADO',
          observations: null,
          attachedDocument: {
            id: 101,
            fileName: 'solicitud_anexo_1.pdf',
            path: 'mock/path/anexo1.pdf',
            isValidated: false,
            uploadedAt: new Date().toISOString(),
            originalPageCount: 3,
            pageCount: null
          }
        },
        {
          id: 2,
          code: 'ANX-2',
          name: 'Formulario para la presentación de protocolos (Anexo 2)',
          status: 'PRESENTADO',
          observations: null,
          attachedDocument: {
            id: 102,
            fileName: 'formulario_anexo_2.pdf',
            path: 'mock/path/anexo2.pdf',
            isValidated: false,
            uploadedAt: new Date().toISOString(),
            originalPageCount: 15,
            pageCount: null
          }
        },
        {
          id: 3,
          code: 'CI-03',
          name: 'Documento de Consentimiento Informado',
          status: 'APROBADO',
          observations: 'Cumple con el formato estándar',
          attachedDocument: {
            id: 103,
            fileName: 'consentimiento_informado.pdf',
            path: 'mock/path/consentimiento.pdf',
            isValidated: true,
            uploadedAt: new Date().toISOString(),
            originalPageCount: 6,
            pageCount: 6
          }
        },
        {
          id: 4,
          code: 'CV-08',
          name: 'Hoja de Vida de los Investigadores',
          status: 'PRESENTADO',
          observations: null,
          attachedDocument: {
            id: 104,
            fileName: 'hoja_de_vida_principal.pdf',
            path: 'mock/path/cv.pdf',
            isValidated: false,
            uploadedAt: new Date().toISOString(),
            originalPageCount: 8,
            pageCount: null
          }
        },
        {
          id: 5,
          code: 'ANX-4',
          name: 'Declaración de Responsabilidad (Anexo 4)',
          status: 'RECHAZADO',
          observations: 'Falta firma del investigador principal',
          attachedDocument: {
            id: 105,
            fileName: 'declaracion_anexo_4.pdf',
            path: 'mock/path/anexo4.pdf',
            isValidated: false,
            uploadedAt: new Date().toISOString(),
            originalPageCount: 2,
            pageCount: 2
          }
        }
      ],
      globalStatus: {
        isComplete: false,
        status: 'EN_REVISION_SECRETARIA',
        hasMissingItems: false,
        missingItemsList: null,
        submissionDeadline: null
      }
    });
  }
}
