import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActiveAssignment } from '@domain/entities/peer-evaluation.entity';
import {
  activeAssignmentStatusLabel,
  formatDeadlineDate,
  peerEvaluatorProfileLabel,
} from '../../utils/active-assignment-view.util';

@Component({
  selector: 'app-tarjeta-evaluador',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './tarjeta-evaluador.component.html',
  styleUrls: ['./tarjeta-evaluador.component.scss'],
})
export class TarjetaEvaluadorComponent {
  @Input({ required: true }) assignment!: ActiveAssignment;
  @Input() showReassignAction: boolean = false;
  @Output() reassignClick = new EventEmitter<ActiveAssignment>();
  @Output() onReassign = new EventEmitter<ActiveAssignment>();

  get profileLabel(): string {
    return peerEvaluatorProfileLabel(this.assignment.evaluatorProfile);
  }

  get profileCssClass(): string {
    return 'badge-' + (this.assignment.evaluatorProfile ?? 'sin-perfil').toLowerCase();
  }

  get statusLabel(): string {
    return activeAssignmentStatusLabel(this.assignment.status);
  }

  get deadlineLabel(): string {
    return formatDeadlineDate(this.assignment.deadlineDate);
  }

  handleReassign(): void {
    this.reassignClick.emit(this.assignment);
    this.onReassign.emit(this.assignment);
  }
}
