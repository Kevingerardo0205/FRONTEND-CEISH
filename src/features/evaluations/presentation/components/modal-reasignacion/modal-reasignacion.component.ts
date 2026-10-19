import { Component, Inject, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReassignPeerEvaluatorUseCase } from '../../../application/reassign-peer-evaluator.use-case';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { ActiveAssignment, ReassignPeerEvaluatorPayload } from '@domain/entities/peer-evaluation.entity';
import { extractApiErrorMessage } from '@shared/utils/api-error-message.util';
import {
  EvaluatorCandidate,
  filterEligibleCandidates,
  mapDashboardCandidates,
  normalizeProfile,
} from '../../utils/reassignment-candidates.util';
import { activeAssignmentStatusLabel, peerEvaluatorProfileLabel } from '../../utils/active-assignment-view.util';

export const REASSIGN_SUCCESS_MESSAGE = 'Evaluador reasignado correctamente. El cambio quedó registrado en el historial de reasignaciones.';

export interface ModalReasignacionData {
  outgoingAssignment: ActiveAssignment;
  /** evaluatorId de todas las asignaciones activas del protocolo (se excluyen como candidatos). */
  activeEvaluatorIds: number[];
  availableEvaluators?: EvaluatorCandidate[];
}

@Component({
  selector: 'app-modal-reasignacion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './modal-reasignacion.component.html',
  styleUrls: ['./modal-reasignacion.component.scss']
})
export class ModalReasignacionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reassignUseCase = inject(ReassignPeerEvaluatorUseCase);
  private evalRepo = inject(IEvaluationRepositoryPort);
  private snack = inject(MatSnackBar);

  form: FormGroup;
  isSubmitting = signal<boolean>(false);
  allCandidates = signal<EvaluatorCandidate[]>([]);
  candidatesError = signal<string | null>(null);
  submitError = signal<string | null>(null);

  motivoOptions = [
    { value: 'VENCIMIENTO', label: 'Vencimiento de Plazo Reglamentario (10 días)' },
    { value: 'CONFLICTO_INTERES', label: 'Conflicto de Interés Declarado' }
  ];

  readonly outgoingProfile = computed(() => normalizeProfile(this.data.outgoingAssignment.evaluatorProfile));

  readonly outgoingProfileLabel = computed(() => {
    const profile = this.outgoingProfile();
    return profile === null ? 'Sin perfil reconocido' : peerEvaluatorProfileLabel(profile);
  });

  get outgoingStatusLabel(): string {
    return activeAssignmentStatusLabel(this.data.outgoingAssignment.status);
  }

  readonly filteredCandidates = computed(() =>
    filterEligibleCandidates(this.allCandidates(), this.data.outgoingAssignment, this.data.activeEvaluatorIds)
  );

  /** Evaluadores del catálogo sin ningún perfil reconocido: no pueden ser candidatos. */
  readonly unrecognizedProfileCount = computed(() => this.allCandidates().filter(c => c.profiles.length === 0).length);

  constructor(
    public dialogRef: MatDialogRef<ModalReasignacionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ModalReasignacionData
  ) {
    // El mínimo de 10 caracteres es una validación de interfaz; no está verificado como regla del backend.
    this.form = this.fb.group({
      newEvaluatorId: ['', Validators.required],
      reason: ['', Validators.required],
      reasonDescription: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    if (this.data.availableEvaluators && this.data.availableEvaluators.length > 0) {
      this.allCandidates.set(this.data.availableEvaluators);
    } else {
      this.loadEvaluators();
    }
  }

  private loadEvaluators(): void {
    this.candidatesError.set(null);
    this.evalRepo.getEvaluatorsDashboard().subscribe({
      next: (dashboardData) => {
        // El dashboard real trae {id, fullName, email, profiles[], currentLoad}; se mapea con un tipo propio.
        this.allCandidates.set(mapDashboardCandidates((dashboardData as { evaluators?: unknown } | null)?.evaluators));
      },
      error: (err) => {
        this.candidatesError.set(
          'No se pudo cargar el catálogo de evaluadores: ' +
            extractApiErrorMessage(err, 'error desconocido al consultar el servidor.')
        );
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    const profile = this.outgoingProfile();
    if (this.form.invalid || profile === null) {
      this.snack.open('Complete todos los campos requeridos con una justificación válida (mínimo 10 caracteres).', 'Cerrar', { duration: 4000 });
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const payload: ReassignPeerEvaluatorPayload = {
      outgoingAssignmentId: this.data.outgoingAssignment.assignmentId,
      replacementEvaluatorId: Number(this.form.value.newEvaluatorId),
      replacementEvaluatorProfile: profile,
      reason: this.form.value.reason as 'VENCIMIENTO' | 'CONFLICTO_INTERES',
      reasonDescription: this.form.value.reasonDescription.trim()
    };

    this.reassignUseCase.execute(payload).subscribe({
      next: () => {
        this.snack.open(REASSIGN_SUCCESS_MESSAGE, 'Cerrar', { duration: 4000 });
        this.isSubmitting.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        const msg = extractApiErrorMessage(err, 'No se pudo reasignar el evaluador.');
        this.submitError.set(msg);
        this.snack.open(msg, 'Cerrar', { duration: 5000 });
        this.isSubmitting.set(false);
      }
    });
  }
}
