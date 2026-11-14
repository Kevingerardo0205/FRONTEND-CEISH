import { Injectable, signal, inject, computed } from '@angular/core';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { EvaluationEntity } from '@domain/entities/evaluation.entity';
import { apiErrorStatus } from '@shared/utils/api-error-message.util';
import { defer, finalize, tap, Observable, Subscription } from 'rxjs';

/** Error de carga del espacio del protocolo (F10 D14): no encontrado (404 y 400) o cualquier otro. */
export type WorkspaceLoadError = 'not-found' | 'failed';

/** 404 del protocolo y 400 de un id que no es número (backend `protocols.service.ts:73-78`). */
const NOT_FOUND_STATUSES: readonly number[] = [400, 404];

@Injectable()
export class ProtocolWorkspaceService {
  private repository = inject(IProtocolRepositoryPort);
  private evaluationRepo = inject(IEvaluationRepositoryPort);

  private protocolSignal = signal<ProtocolEntity | null>(null);
  private evaluationsSignal = signal<EvaluationEntity[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<WorkspaceLoadError | null>(null);
  private evaluationsLoadingSignal = signal<boolean>(false);
  private evaluationsErrorSignal = signal<boolean>(false);

  /** `:id` de la última carga pedida; si cambia, no se muestra nada del anterior (D14). */
  private currentId: string | null = null;
  private evaluationsSub: Subscription | null = null;

  // Read-only signals
  public protocol = this.protocolSignal.asReadonly();
  public evaluations = this.evaluationsSignal.asReadonly();
  public isLoading = this.loadingSignal.asReadonly();
  public error = this.errorSignal.asReadonly();
  public evaluationsLoading = this.evaluationsLoadingSignal.asReadonly();
  public evaluationsError = this.evaluationsErrorSignal.asReadonly();

  // Derived state
  public protocolId = computed(() => this.protocol()?.id);
  public status = computed(() => this.protocol()?.status);

  /**
   * Carga el protocolo al suscribirse (D14). Con otro `:id`, vacía el protocolo y las evaluaciones
   * antes de pedirlo; con el mismo (recarga después de Asignar Pares), conserva los datos. Las
   * evaluaciones ya no se piden aquí: las pide el Resumen (EARS 28).
   */
  public loadProtocol(id: string): Observable<ProtocolEntity> {
    return defer(() => {
      if (id !== this.currentId) {
        this.currentId = id;
        this.evaluationsSub?.unsubscribe();
        this.protocolSignal.set(null);
        this.evaluationsSignal.set([]);
        this.evaluationsLoadingSignal.set(false);
        this.evaluationsErrorSignal.set(false);
      }
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      return this.repository.getById(id).pipe(
        tap({
          next: (data) => this.protocolSignal.set(data),
          error: (err) => {
            console.error('[ProtocolWorkspaceService] Error loading protocol:', err);
            const status = apiErrorStatus(err);
            this.errorSignal.set(
              status !== null && NOT_FOUND_STATUSES.includes(status) ? 'not-found' : 'failed',
            );
          },
        }),
        finalize(() => this.loadingSignal.set(false)),
      );
    });
  }

  /** Evaluaciones del protocolo, para el Resumen (D14): un error no se muestra como lista vacía. */
  public loadEvaluations(protocolId: string): void {
    this.evaluationsSub?.unsubscribe();
    this.evaluationsLoadingSignal.set(true);
    this.evaluationsErrorSignal.set(false);
    this.evaluationsSub = this.evaluationRepo
      .getByProtocolId(protocolId)
      .pipe(finalize(() => this.evaluationsLoadingSignal.set(false)))
      .subscribe({
        next: (list) => this.evaluationsSignal.set(list || []),
        error: () => this.evaluationsErrorSignal.set(true),
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
    this.currentId = null;
    this.evaluationsSub?.unsubscribe();
    this.protocolSignal.set(null);
    this.evaluationsSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.evaluationsLoadingSignal.set(false);
    this.evaluationsErrorSignal.set(false);
  }
}
