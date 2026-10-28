import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  IAmendmentRepositoryPort,
  ApprovedProtocolOption,
} from '../domain/ports/amendment-repository.port';
import {
  AmendmentItem,
  AmendmentStatus,
  AmendmentType,
  AmendmentSeverity,
  CreateAmendmentDTO,
  ReviewAmendmentDTO,
} from '../domain/entities/amendment.entity';
import { ApiClientService } from '@infrastructure/api/api-client.service';
import { ENDPOINTS } from '@infrastructure/api/endpoints.constant';

@Injectable({ providedIn: 'root' })
export class AmendmentApiAdapter implements IAmendmentRepositoryPort {
  private readonly apiClient = inject(ApiClientService);

  // Almacén en memoria para estado local y fallback garantizado
  private localAmendments: AmendmentItem[] = [
    {
      id: 'enm-001',
      protocolId: '1',
      protocolCode: 'CEISH-2026-001',
      protocolTitle: 'Evaluación del impacto nutricional en comunidades altoandinas',
      investigatorName: 'Dr. Marco Vinicio Ramos',
      type: AmendmentType.METHODOLOGY,
      severity: AmendmentSeverity.SUBSTANTIAL,
      status: AmendmentStatus.UNDER_REVIEW,
      justification:
        'Inclusión de biomarcadores séricos adicionales para mayor precisión diagnóstica.',
      ethicalImpactDescription:
        'Se incrementa el volumen de extracción sanguínea en 5ml, se actualizó el Consentimiento Informado Anexo 23.',
      documents: [
        {
          name: 'Protocolo_V2_ControlCambios.pdf',
          type: 'TRACKED_CHANGES',
          sizeBytes: 1024 * 1024 * 2.4,
        },
        { name: 'Protocolo_V2_Limpio.pdf', type: 'CLEAN_VERSION', sizeBytes: 1024 * 1024 * 2.1 },
        { name: 'Consentimiento_Informado_V2.pdf', type: 'OTHER', sizeBytes: 1024 * 512 },
      ],
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      versionNumber: 2,
    },
    {
      id: 'enm-002',
      protocolId: '2',
      protocolCode: 'CEISH-2026-004',
      protocolTitle: 'Estudio de prevalencia de resistencia antimicrobiana hospitalaria',
      investigatorName: 'Dra. Elena Elizabeth Morales',
      type: AmendmentType.SCHEDULE,
      severity: AmendmentSeverity.NON_SUBSTANTIAL,
      status: AmendmentStatus.APPROVED,
      justification:
        'Ampliación del período de reclutamiento por 3 meses debido a demoras en suministro de reactivos.',
      ethicalImpactDescription: 'No altera el riesgo biológico ni los procedimientos en pacientes.',
      documents: [
        { name: 'Cronograma_Actualizado_2026.pdf', type: 'CLEAN_VERSION', sizeBytes: 1024 * 350 },
      ],
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      reviewedBy: 'Presidente CEISH',
      reviewNotes: 'Aprobado. No altera el balance ético de riesgos ni vulnera la autonomía.',
      versionNumber: 2,
    },
  ];

  getApprovedProtocols(): Observable<ApprovedProtocolOption[]> {
    return this.apiClient.get<any>(ENDPOINTS.PROTOCOLS.BASE).pipe(
      map((res: any) => {
        const raw = Array.isArray(res) ? res : res?.data || [];
        const approved = raw
          .filter((p: any) => {
            const status = (p.status || p.estado || '').toUpperCase();
            return (
              status.includes('APROBADO') ||
              status.includes('ACEPTADO') ||
              status.includes('DICTAMEN') ||
              status.includes('FINALIZADO') ||
              status.includes('REVISION')
            );
          })
          .map((p: any) => ({
            id: String(p.id || p.protocolo_id),
            code: p.code || p.codigo || `CEISH-${p.id}`,
            title: p.title || p.titulo || 'Protocolo Aprobado',
            investigatorName:
              p.principalInvestigator ||
              p.investigadorPrincipal?.fullName ||
              'Investigador Principal',
            approvalDate: p.approvedAt || p.fechaAprobacion || new Date().toISOString(),
            currentVersion: p.currentVersion || p.version || 1,
          }));

        if (approved.length === 0) {
          // Fallback con opciones institucionales
          return [
            {
              id: '1',
              code: 'CEISH-2026-001',
              title: 'Evaluación del impacto nutricional en comunidades altoandinas',
              investigatorName: 'Dr. Marco Vinicio Ramos',
              approvalDate: '2026-01-15',
              currentVersion: 1,
            },
            {
              id: '2',
              code: 'CEISH-2026-004',
              title: 'Estudio de prevalencia de resistencia antimicrobiana hospitalaria',
              investigatorName: 'Dra. Elena Elizabeth Morales',
              approvalDate: '2026-02-10',
              currentVersion: 1,
            },
            {
              id: '3',
              code: 'CEISH-2026-009',
              title: 'Ensayos de bioequivalencia de fitofármacos en voluntarios sanos',
              investigatorName: 'Dr. Jaime David Camacho Castillo',
              approvalDate: '2026-03-01',
              currentVersion: 1,
            },
          ];
        }
        return approved;
      }),
      catchError(() => {
        return of([
          {
            id: '1',
            code: 'CEISH-2026-001',
            title: 'Evaluación del impacto nutricional en comunidades altoandinas',
            investigatorName: 'Dr. Marco Vinicio Ramos',
            approvalDate: '2026-01-15',
            currentVersion: 1,
          },
          {
            id: '2',
            code: 'CEISH-2026-004',
            title: 'Estudio de prevalencia de resistencia antimicrobiana hospitalaria',
            investigatorName: 'Dra. Elena Elizabeth Morales',
            approvalDate: '2026-02-10',
            currentVersion: 1,
          },
        ]);
      }),
    );
  }

  getAmendments(): Observable<AmendmentItem[]> {
    return of([...this.localAmendments]);
  }

  getAmendmentsByProtocolId(protocolId: string): Observable<AmendmentItem[]> {
    const filtered = this.localAmendments.filter((a) => a.protocolId === protocolId);
    return of(filtered);
  }

  getAmendmentById(id: string): Observable<AmendmentItem> {
    const item = this.localAmendments.find((a) => a.id === id);
    if (!item) {
      throw new Error(`Enmienda con ID ${id} no encontrada`);
    }
    return of({ ...item });
  }

  createAmendment(dto: CreateAmendmentDTO): Observable<AmendmentItem> {
    const newAmendment: AmendmentItem = {
      id: `enm-${Date.now().toString().slice(-4)}`,
      protocolId: dto.protocolId,
      protocolCode: dto.protocolCode,
      protocolTitle: dto.protocolTitle,
      investigatorName: 'Investigador Solicitante',
      type: dto.type,
      severity: dto.severity,
      status: AmendmentStatus.SUBMITTED,
      justification: dto.justification,
      ethicalImpactDescription: dto.ethicalImpactDescription,
      documents: dto.documents.map((d) => ({
        name: d.name,
        type: d.type,
        sizeBytes: d.file ? d.file.size : 1024 * 500,
        uploadedAt: new Date(),
      })),
      submittedAt: new Date().toISOString(),
      versionNumber: 2,
    };

    this.localAmendments = [newAmendment, ...this.localAmendments];
    return of(newAmendment);
  }

  reviewAmendment(dto: ReviewAmendmentDTO): Observable<AmendmentItem> {
    const index = this.localAmendments.findIndex((a) => a.id === dto.amendmentId);
    if (index === -1) {
      throw new Error('Enmienda no encontrada para dictamen');
    }

    const updated: AmendmentItem = {
      ...this.localAmendments[index],
      status: dto.status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Comité Ético CEISH',
      reviewNotes: dto.reviewNotes,
    };

    this.localAmendments[index] = updated;
    return of(updated);
  }
}
