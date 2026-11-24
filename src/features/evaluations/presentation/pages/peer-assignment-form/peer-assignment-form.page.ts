import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, catchError, combineLatest, forkJoin, of, throwError } from 'rxjs';
import { distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import {
  AssignEvaluatorsResponse,
  AssignmentMember,
  AssignmentReviewType,
  PEER_EVALUATOR_PROFILE_LABELS,
  PeerEvaluatorProfile,
} from '@domain/entities/peer-evaluation.entity';
import {
  AssignmentSelection,
  REQUIRED_PROFILE,
  TERMS_NOT_ACCEPTED_REASON,
  compositionBlockReason,
  expeditedRowProfiles,
  membersWithProfile,
  toAssignedEvaluators,
} from '@domain/entities/peer-assignment-composition';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { ErrorStateComponent, LoadingStateComponent } from '@shared/ui/states/states.component';
import { apiErrorStatus, extractApiErrorMessage } from '@shared/utils/api-error-message.util';
import { AssignPeerEvaluatorsUseCase } from '../../../application/assign-peer-evaluators.use-case';
import { LoadAssignmentMembersUseCase } from '../../../application/load-assignment-members.use-case';
import {
  AssignmentProtocolSummary,
  LoadAssignmentProtocolUseCase,
} from '../../../application/load-assignment-protocol.use-case';
import { ASSIGNMENT_LIST_ROUTE } from '../peer-assignment-list/peer-assignment-list.page';

type EstadoCarga = 'cargando' | 'listo' | 'error' | 'no-encontrado';

/** Fila de la revisión expedita: el perfil es fijo (F03 D3). */
interface ExpeditedRow {
  profile: PeerEvaluatorProfile;
  evaluatorId: number | null;
  removed: boolean;
}

/** Fila de la revisión en pleno: la persona es fija (F03 D4). */
interface PlenaryRow {
  memberId: number;
  profile: PeerEvaluatorProfile | null;
  included: boolean;
}

interface ResultadoFila {
  key: string;
  nombre: string;
  perfil: string;
  defineRiesgo: boolean;
}

export const SUBMIT_ERROR_FALLBACK = 'No se pudieron asignar los evaluadores.';

/** F03 D7: si no se sabe el nombre de una persona asignada; nunca se muestra su id. */
export const NAME_NOT_AVAILABLE = 'Nombre no disponible';

/** Marca del 404 o 400 de `GET /protocols/:id` (F03 §4); los demás errores son «error». */
const PROTOCOL_NOT_FOUND = Symbol('protocol-not-found');

/**
 * Formulario de asignación de la Presidenta (F03 D3 a D7): tipo de revisión primero, después las
 * personas; envía el cuerpo de N52 y muestra tal cual los 400 y 409 del backend.
 */
@Component({
  selector: 'app-peer-assignment-form-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, LoadingStateComponent, ErrorStateComponent, RouterLink],
  templateUrl: './peer-assignment-form.page.html',
  styleUrl: './peer-assignment-form.page.scss',
})
export class PeerAssignmentFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly loadProtocol = inject(LoadAssignmentProtocolUseCase);
  private readonly loadMembers = inject(LoadAssignmentMembersUseCase);
  private readonly assign = inject(AssignPeerEvaluatorsUseCase);
  private readonly destroyRef = inject(DestroyRef);

  readonly listRoute = ASSIGNMENT_LIST_ROUTE;
  /**
   * Dentro del espacio del protocolo (workspace/:id/assignment): el id llega por la ruta padre. Ahí
   * no hay «Revisar documentación» (está en Recepción → Validación Técnica) ni «Volver a la lista», y el
   * botón de asignar aparece después de elegir el tipo de revisión (F11-32, F11-33).
   */
  readonly inWorkspace =
    !!this.route.parent?.snapshot?.paramMap?.get('id') &&
    !this.route.snapshot.paramMap.get('protocolId');
  readonly requiredProfile = REQUIRED_PROFILE;

  readonly estado = signal<EstadoCarga>('cargando');
  readonly protocol = signal<AssignmentProtocolSummary | null>(null);
  readonly members = signal<AssignmentMember[]>([]);
  readonly reviewType = signal<AssignmentReviewType | null>(null);
  readonly expeditedRows = signal<ExpeditedRow[]>([]);
  readonly plenaryRows = signal<PlenaryRow[]>([]);
  readonly sending = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly result = signal<AssignEvaluatorsResponse | null>(null);
  /** Nombres de lo que la Presidenta envió, por id: el éxito los muestra (F03 D7). */
  private readonly submittedNames = signal<ReadonlyMap<number, string>>(new Map());

  private readonly protocolId = signal(0);

  readonly subtitle = computed(() => {
    const p = this.protocol();
    if (!p) return '';
    return [p.code, p.title ?? 'Sin título'].filter((t): t is string => !!t).join(' · ');
  });

  private readonly memberById = computed(
    () => new Map(this.members().map((m) => [m.id, m] as const)),
  );

  /** Filas visibles de la expedita, con sus personas posibles. */
  readonly expeditedView = computed(() =>
    this.expeditedRows()
      .filter((r) => !r.removed)
      .map((r) => ({
        ...r,
        label: PEER_EVALUATOR_PROFILE_LABELS[r.profile],
        options: membersWithProfile(this.members(), r.profile),
      })),
  );

  /** Filas quitadas de la expedita, para volver a ponerlas. */
  readonly removedExpedited = computed(() =>
    this.expeditedRows()
      .filter((r) => r.removed)
      .map((r) => ({ profile: r.profile, label: PEER_EVALUATOR_PROFILE_LABELS[r.profile] })),
  );

  readonly plenaryView = computed(() =>
    this.plenaryRows().flatMap((r) => {
      const member = this.memberById().get(r.memberId);
      return member
        ? [
            {
              ...r,
              fullName: member.fullName,
              options: member.profiles.map((p) => ({
                value: p,
                label: PEER_EVALUATOR_PROFILE_LABELS[p],
              })),
              hasProfiles: member.profiles.length > 0,
            },
          ]
        : [];
    }),
  );

  readonly selections = computed<AssignmentSelection[]>(() => {
    const type = this.reviewType();
    if (type === 'EXPEDITA') {
      return this.expeditedRows()
        .filter((r) => !r.removed)
        .map((r) => ({
          rowLabel: PEER_EVALUATOR_PROFILE_LABELS[r.profile],
          evaluatorId: r.evaluatorId,
          evaluatorName:
            r.evaluatorId === null ? null : (this.memberById().get(r.evaluatorId)?.fullName ?? null),
          profile: r.profile,
        }));
    }
    if (type === 'PLENO') {
      return this.plenaryRows()
        .filter((r) => r.included)
        .map((r) => {
          const name = this.memberById().get(r.memberId)?.fullName ?? '';
          return { rowLabel: name, evaluatorId: r.memberId, evaluatorName: name, profile: r.profile };
        });
    }
    return [];
  });

  /** Primer motivo de F03 D5, o null si se puede enviar. */
  readonly blockReason = computed<string | null>(() => {
    const p = this.protocol();
    if (p && !p.isTimelineTermsAccepted) return TERMS_NOT_ACCEPTED_REASON;
    return compositionBlockReason(this.reviewType(), this.selections());
  });

  readonly resultRows = computed<ResultadoFila[]>(() =>
    (this.result()?.assignments ?? []).map((a, i) => ({
      key: `${a.assignmentId ?? 'sin-id'}-${i}`,
      nombre: this.submittedNames().get(a.evaluatorId) ?? NAME_NOT_AVAILABLE,
      perfil: PEER_EVALUATOR_PROFILE_LABELS[a.profile as PeerEvaluatorProfile] ?? a.profile,
      defineRiesgo: a.isRiskPeer,
    })),
  );

  ngOnInit(): void {
    const routeParamMap$ = (this.route.paramMap ?? of(this.route.snapshot.paramMap)).pipe(
      startWith(this.route.snapshot.paramMap),
    );
    // En el espacio (workspace/:id/assignment) el id llega por la ruta padre.
    const parentParamMap$ = (this.route.parent?.paramMap ??
      of(this.route.parent?.snapshot.paramMap ?? null)).pipe(
      startWith(this.route.parent?.snapshot.paramMap ?? null),
    );

    combineLatest([routeParamMap$, parentParamMap$])
      .pipe(
        map(([routeParams, parentParams]) => routeParams.get('protocolId') ?? parentParams?.get('id') ?? ''),
        map((raw) => (/^\d+$/.test(raw) ? Number(raw) : 0)),
        distinctUntilChanged(),
        switchMap((protocolId) => this.cargarProtocolo(protocolId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ protocol, members }) => {
          if (!protocol) return;
          this.protocol.set(protocol);
          this.members.set(members);
          this.estado.set('listo');
        },
        error: (err: unknown) =>
          this.estado.set(err === PROTOCOL_NOT_FOUND ? 'no-encontrado' : 'error'),
      });
  }

  cargar(): void {
    this.cargarProtocolo(this.protocolId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ protocol, members }) => {
          if (!protocol) return;
          this.protocol.set(protocol);
          this.members.set(members);
          this.estado.set('listo');
        },
        error: (err: unknown) =>
          this.estado.set(err === PROTOCOL_NOT_FOUND ? 'no-encontrado' : 'error'),
      });
  }

  private cargarProtocolo(protocolId: number): Observable<{
    protocol: AssignmentProtocolSummary | null;
    members: AssignmentMember[];
  }> {
    this.protocolId.set(protocolId);
    this.protocol.set(null);
    this.members.set([]);
    this.reviewType.set(null);
    this.expeditedRows.set([]);
    this.plenaryRows.set([]);
    this.result.set(null);
    this.submitError.set(null);

    if (protocolId <= 0) {
      this.estado.set('no-encontrado');
      return of({ protocol: null, members: [] as AssignmentMember[] });
    }

    this.estado.set('cargando');
    const protocol$ = this.loadProtocol.execute(protocolId).pipe(
      catchError((err: unknown) => {
        const status = apiErrorStatus(err);
        return throwError(() => (status === 404 || status === 400 ? PROTOCOL_NOT_FOUND : err));
      }),
    );
    return forkJoin({ protocol: protocol$, members: this.loadMembers.execute() }).pipe(
      catchError((err: unknown) => {
        this.estado.set(err === PROTOCOL_NOT_FOUND ? 'no-encontrado' : 'error');
        return of({ protocol: null, members: [] as AssignmentMember[] });
      }),
    );
  }

  /** Al cambiar el tipo, la composición se arma desde cero (F03 §5). */
  setReviewType(type: AssignmentReviewType): void {
    this.reviewType.set(type);
    this.submitError.set(null);
    const members = this.members();
    this.expeditedRows.set(
      expeditedRowProfiles(members).map((profile) => ({ profile, evaluatorId: null, removed: false })),
    );
    this.plenaryRows.set(
      members.map((m) => ({ memberId: m.id, profile: null, included: m.profiles.length > 0 })),
    );
  }

  chooseExpeditedPerson(profile: PeerEvaluatorProfile, value: string): void {
    const id = /^\d+$/.test(value) ? Number(value) : null;
    this.updateExpedited(profile, (r) => ({ ...r, evaluatorId: id }));
  }

  /** La fila de Sociedad Civil no se quita (F03 D3). */
  removeExpeditedRow(profile: PeerEvaluatorProfile): void {
    if (profile === REQUIRED_PROFILE) return;
    this.updateExpedited(profile, (r) => ({ ...r, removed: true, evaluatorId: null }));
  }

  restoreExpeditedRow(profile: PeerEvaluatorProfile): void {
    this.updateExpedited(profile, (r) => ({ ...r, removed: false }));
  }

  choosePlenaryProfile(memberId: number, value: string): void {
    const member = this.memberById().get(memberId);
    const profile = member?.profiles.find((p) => p === value) ?? null;
    this.updatePlenary(memberId, (r) => ({ ...r, profile }));
  }

  /** Quitar o incluir a una persona; sin perfiles no se puede incluir (F03 D4). */
  togglePlenary(memberId: number): void {
    const member = this.memberById().get(memberId);
    this.updatePlenary(memberId, (r) =>
      r.included || !member?.profiles.length ? { ...r, included: false } : { ...r, included: true },
    );
  }

  onSubmit(): void {
    const type = this.reviewType();
    if (this.blockReason() !== null || this.sending() || type === null) return;
    const selections = this.selections();
    this.sending.set(true);
    this.submitError.set(null);
    this.submittedNames.set(
      new Map(
        selections.flatMap((s) =>
          s.evaluatorId !== null && s.evaluatorName ? [[s.evaluatorId, s.evaluatorName] as const] : [],
        ),
      ),
    );
    this.assign
      .execute(this.protocolId(), { reviewType: type, evaluators: toAssignedEvaluators(selections) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.sending.set(false);
        },
        error: (err: unknown) => {
          // F03 D6: el 400 o 409 del backend tal cual (el interceptor lo deja en `message`).
          this.submitError.set(extractApiErrorMessage(err, SUBMIT_ERROR_FALLBACK));
          this.sending.set(false);
        },
      });
  }

  revisarDocumentacion(): void {
    if (this.protocolId() <= 0) return;
    void this.router.navigate(['/dashboard/protocols/workspace', this.protocolId(), 'validation'], {
      queryParams: { origin: 'assignment-form' },
    });
  }

  private updateExpedited(profile: PeerEvaluatorProfile, fn: (r: ExpeditedRow) => ExpeditedRow): void {
    this.expeditedRows.update((rows) => rows.map((r) => (r.profile === profile ? fn(r) : r)));
  }

  private updatePlenary(memberId: number, fn: (r: PlenaryRow) => PlenaryRow): void {
    this.plenaryRows.update((rows) => rows.map((r) => (r.memberId === memberId ? fn(r) : r)));
  }
}
