import { Injectable, inject, signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';
import { resolveEstado } from '@shared/utils/estado.resolver';

export interface SecretariatMetrics {
  pendingReception: number;
  observed: number;
  overdue: number;
  slaRisk: number;
  responseAverageDays: number;
}

@Injectable()
export class SecretariatDashboardService {
  private protocolRepo = inject(IProtocolRepositoryPort);
  // 1. Master Signals
  private allProtocolsSignal = signal<ProtocolEntity[]>([]);
  private protocolsSignal = signal<ProtocolEntity[]>([]);
  private loadingSignal = signal<boolean>(false);
  private searchQuerySignal = signal<string>('');
  private filterStatusSignal = signal<string>('ALL');

  // 2. Read-Only Signals
  public protocols = this.allProtocolsSignal.asReadonly();
  public isLoading = this.loadingSignal.asReadonly();
  public searchQuery = this.searchQuerySignal.asReadonly();
  public filterStatus = this.filterStatusSignal.asReadonly();

  // 3. Computed: Filtros dinámicos reactivos
  public filteredProtocols = computed(() => {
    const query = this.searchQuerySignal().toLowerCase().trim();
    let list = this.protocolsSignal();

    if (query) {
      list = list.filter(p => 
        (p.code && p.code.toLowerCase().includes(query)) ||
        p.title.toLowerCase().includes(query) ||
        (p.principalInvestigator && p.principalInvestigator.toLowerCase().includes(query))
      );
    }

    return list;
  });

  // 4. Computed: KPIs del Dashboard en tiempo real
  public metrics = computed((): SecretariatMetrics => {
    const all = this.allProtocolsSignal();
    const now = new Date();

    return {
      pendingReception: all.filter(p => {
        const core = resolveEstado(p.status);
        return core && ((core.categoria === 'RECEPCION' && ['INICIADO', 'EN_REVISION_SECRETARIA'].includes(core.code)) || core.code === 'EN_CONTROL_DOCUMENTAL');
      }).length,
      observed: all.filter(p => {
        const core = resolveEstado(p.status);
        return core && ['INCOMPLETO', 'REQUIERE_SUBSANACION_DOC', 'REQUIERE_SUBSANACION_VERSION', 'DISCREPANCIA_RIESGO'].includes(core.code);
      }).length,
      overdue: all.filter(p => p.deadline && new Date(p.deadline) < now).length,
      slaRisk: all.filter(p => {
        if (!p.deadline) return false;
        const diffDays = Math.ceil((new Date(p.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
      }).length,
      responseAverageDays: 2.3
    };
  });

  private loadFilteredData() {
    this.loadingSignal.set(true);
    const filter = this.filterStatusSignal();
    let apiStatus: string | undefined = undefined;
    if (filter === 'SUBMITTED') {
      apiStatus = 'pendientes';
    } else if (filter === 'EN_REVISION_DOCUMENTAL') {
      apiStatus = 'incompletos';
    } else if (filter === 'VALIDATED') {
      apiStatus = 'validados';
    }

    this.protocolRepo.getReceptionProtocols(apiStatus).subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        this.protocolsSignal.set(list);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.error('[SecretariatDashboardService] Error cargando protocolos filtrados:', err);
        this.loadingSignal.set(false);
      }
    });
  }

  public loadDashboardData() {
    this.loadingSignal.set(true);
    return this.protocolRepo.getReceptionProtocols().pipe(
      tap(data => {
        const list = Array.isArray(data) ? data : [];
        this.allProtocolsSignal.set(list);
        this.loadFilteredData();
      }),
      catchError(err => {
        console.error('[SecretariatDashboardService] Error cargando todos los protocolos:', err);
        return of([]);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  public updateSearch(query: string) {
    this.searchQuerySignal.set(query);
  }

  public updateFilter(status: string) {
    this.filterStatusSignal.set(status);
    this.loadFilteredData();
  }
}
