import { Injectable, inject, signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolStatus } from '@domain/enums/protocol-status.enum';

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
  private protocolsSignal = signal<ProtocolEntity[]>([]);
  private loadingSignal = signal<boolean>(false);
  private searchQuerySignal = signal<string>('');
  private filterStatusSignal = signal<string>('ALL');

  // 2. Read-Only Signals
  public protocols = this.protocolsSignal.asReadonly();
  public isLoading = this.loadingSignal.asReadonly();
  public searchQuery = this.searchQuerySignal.asReadonly();
  public filterStatus = this.filterStatusSignal.asReadonly();

  // 3. Computed: Filtros dinámicos reactivos
  public filteredProtocols = computed(() => {
    const query = this.searchQuerySignal().toLowerCase().trim();
    const statusFilter = this.filterStatusSignal();
    let list = this.protocolsSignal();

    if (statusFilter !== 'ALL') {
      list = list.filter(p => {
        const s = p.status?.toUpperCase();
        if (statusFilter === 'SUBMITTED') {
          return s === 'SUBMITTED' || s === 'PRESENTADO' || s === 'BORRADOR';
        }
        if (statusFilter === 'EN_REVISION_DOCUMENTAL') {
          return s === 'EN_REVISION_DOCUMENTAL' || s === 'EN_REVISION_SECRETARIA';
        }
        return s === statusFilter;
      });
    }

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
    const all = this.protocolsSignal();
    const now = new Date();

    return {
      pendingReception: all.filter(p => {
        const s = p.status?.toUpperCase();
        return s === 'SUBMITTED' || s === 'PRESENTADO' || s === 'BORRADOR';
      }).length,
      observed: all.filter(p => {
        const s = p.status?.toUpperCase();
        return s === 'EN_REVISION_DOCUMENTAL' || s === 'EN_REVISION_SECRETARIA';
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

  public loadDashboardData() {
    this.loadingSignal.set(true);
    return this.protocolRepo.getReceptionProtocols().pipe(
      tap(data => {
        const list = Array.isArray(data) ? data : [];
        this.protocolsSignal.set(list);
      }),
      catchError(err => {
        console.error('[SecretariatDashboardService] Error cargando protocolos:', err);
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
  }
}
