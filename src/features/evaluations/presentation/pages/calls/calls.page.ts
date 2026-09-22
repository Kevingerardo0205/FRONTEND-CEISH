import {
  Component,
  inject,
  signal,
  OnInit,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { LoadCallsUseCase } from '../../../application/load-calls.use-case';
import { CallEntity } from 'src/domain/evaluations/call.entity';

@Component({
  selector: 'app-calls-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatDialogModule,
  ],
  templateUrl: './calls.page.html',
  styleUrl: './calls.page.scss',
})
export class CallsPage implements OnInit {
  private readonly loadCallsUC = inject(LoadCallsUseCase);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly calls = signal<CallEntity[]>([]);
  readonly isLoading = signal<boolean>(false);

  readonly hasCalls = computed(() => this.calls().length > 0);

  ngOnInit(): void {
    this.fetchCalls();
  }

  fetchCalls(): void {
    this.isLoading.set(true);
    this.loadCallsUC
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: CallEntity[]) => {
          this.calls.set(data || []);
          this.isLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Error al cargar la lista de convocatorias:', err);
          this.snackBar.open('❌ Error al cargar la bandeja de convocatorias.', 'Cerrar', {
            duration: 4000,
          });
          this.isLoading.set(false);
        },
      });
  }

  getStatusClass(statusId: number): string {
    switch (statusId) {
      case 22:
        return 'creada';
      case 23:
        return 'enviada';
      case 24:
        return 'finalizada';
      default:
        return 'creada';
    }
  }

  getStatusLabel(statusId: number): string {
    switch (statusId) {
      case 22:
        return 'Creada';
      case 23:
        return 'Enviada';
      case 24:
        return 'Finalizada';
      default:
        return 'Programada';
    }
  }
}
