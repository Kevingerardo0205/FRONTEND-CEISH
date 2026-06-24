import { Injectable, signal, inject, computed } from '@angular/core';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { EvaluationEntity } from '@domain/entities/evaluation.entity';
import { finalize, tap, of, catchError } from 'rxjs';

@Injectable()
export class ProtocolWorkspaceService {
  private repository = inject(IProtocolRepositoryPort);
  private evaluationRepo = inject(IEvaluationRepositoryPort);

  private protocolSignal = signal<ProtocolEntity | null>(null);
  private evaluationsSignal = signal<EvaluationEntity[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Read-only signals
  public protocol = this.protocolSignal.asReadonly();
  public evaluations = this.evaluationsSignal.asReadonly();
  public isLoading = this.loadingSignal.asReadonly();
  public error = this.errorSignal.asReadonly();

  // Derived state
  public protocolId = computed(() => this.protocol()?.id);
  public status = computed(() => this.protocol()?.status);

  public loadProtocol(id: string) {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.repository.getById(id).pipe(
      tap({
        next: (data) => {
          this.protocolSignal.set(data);
          // Al cargar el protocolo, intentamos cargar sus evaluaciones
          this.loadEvaluations(id);
        },
        error: (err) => {
          console.error('[ProtocolWorkspaceService] Error loading protocol:', err);
          this.errorSignal.set('No se pudo cargar la información del protocolo.');
        }
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  private loadEvaluations(protocolId: string) {
    this.evaluationRepo.getByProtocolId(protocolId).pipe(
      catchError(() => of([]))
    ).subscribe(list => {
      this.evaluationsSignal.set(list || []);
    });
  }

  public updateProtocol(data: Partial<ProtocolEntity>) {
    const current = this.protocolSignal();
    if (current) {
      this.protocolSignal.set({ ...current, ...data });
    }
  }

  public refreshEvaluations() {
    const id = this.protocol()?.id;
    if (id) this.loadEvaluations(id);
  }

  public clear() {
    this.protocolSignal.set(null);
    this.evaluationsSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
