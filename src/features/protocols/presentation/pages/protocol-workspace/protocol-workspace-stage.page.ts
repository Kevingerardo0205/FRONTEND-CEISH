import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { distinctUntilChanged, startWith, switchMap } from 'rxjs/operators';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { WorkspaceInformationState } from '../../../domain/workspace-stage-state';

type StageCode = 'EVALUACION' | 'RESOLUCION' | 'SEGUIMIENTO' | 'RENOVACION';

const TITLES: Readonly<Record<StageCode, string>> = {
  EVALUACION: 'Evaluación',
  RESOLUCION: 'Resolución',
  SEGUIMIENTO: 'Seguimiento',
  RENOVACION: 'Renovación',
};

@Component({
  selector: 'app-protocol-workspace-stage',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="workspace-stage" [attr.data-stage]="stage()">
      <header class="workspace-stage__header">
        <p class="workspace-stage__eyebrow">Apartado del expediente</p>
        <h2>{{ title() }}</h2>
        <p class="workspace-stage__description">Consulta disponible dentro del workspace.</p>
      </header>

      @if (informationState().kind === 'loading') {
        <p role="status">Cargando información…</p>
      } @else if (informationState().kind === 'empty' && !hasData()) {
        <p role="status">Sin registros confirmados para este apartado.</p>
      } @else if (informationState().kind === 'unavailable') {
        <p role="status">Fuente no disponible para consultar este apartado.</p>
      } @else if (informationState().kind === 'error') {
        <p role="alert">No pudimos consultar la fuente de este apartado.</p>
      } @else {
        <p role="status">La fuente entregó información disponible para consulta.</p>
        <p class="workspace-stage__count">Registros consultados: {{ recordCount() }}</p>
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    .workspace-stage { padding: clamp(1rem, 3vw, 2rem); border: 1px solid var(--c-border); border-radius: var(--radius-card); background: var(--c-surface); }
    .workspace-stage__header { margin-bottom: 1.5rem; }
    .workspace-stage__eyebrow { margin: 0 0 .25rem; color: var(--c-text-2); font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; }
    h2 { margin: 0; color: var(--c-text); }
    .workspace-stage__description, .workspace-stage__count { color: var(--c-text-2); }
  `,
})
export class ProtocolWorkspaceStagePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly evaluations = inject(IEvaluationRepositoryPort);
  private readonly resolutions = inject(IResolutionRepositoryPort);
  private readonly destroyRef = inject(DestroyRef);

  readonly stage = signal<StageCode>('EVALUACION');
  readonly title = signal('Evaluación');
  readonly informationState = signal<WorkspaceInformationState>({ kind: 'loading' });
  readonly recordCount = signal(0);
  readonly hasData = signal(false);

  ngOnInit(): void {
    const stage = this.route.snapshot.data['stage'] as StageCode | undefined;
    if (!stage) {
      this.informationState.set({ kind: 'unavailable' });
      return;
    }

    this.stage.set(stage);
    this.title.set(TITLES[stage]);

    const parentParamMap$ = (this.route.parent?.paramMap ??
      of(this.route.parent?.snapshot.paramMap ?? null)).pipe(
      startWith(this.route.parent?.snapshot.paramMap ?? null),
    );
    parentParamMap$
      .pipe(
        map((params) => params?.get('id') ?? ''),
        distinctUntilChanged(),
        switchMap((protocolId) => {
          this.recordCount.set(0);
          this.hasData.set(false);
          if (!/^\d+$/.test(protocolId)) {
            this.informationState.set({ kind: 'unavailable' });
            return of(null as readonly unknown[] | null);
          }
          if (stage === 'SEGUIMIENTO' || stage === 'RENOVACION') {
            this.informationState.set({ kind: 'unavailable' });
            return of(null as readonly unknown[] | null);
          }
          this.informationState.set({ kind: 'loading' });
          const source$: Observable<readonly unknown[]> =
            stage === 'EVALUACION'
              ? this.evaluations.getByProtocolId(protocolId).pipe(map((records) => records as readonly unknown[]))
              : this.resolutions
                  .getResolutionByProtocolId(protocolId)
                  .pipe(map((record) => (record ? [record] : [])));
          return source$.pipe(
            catchError(() => {
              this.informationState.set({ kind: 'error' });
              return of(null as readonly unknown[] | null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((records) => {
        if (records === null) return;
        const count = records.length;
        this.recordCount.set(count);
        this.hasData.set(count > 0);
        this.informationState.set({ kind: 'empty' });
      });
  }
}
