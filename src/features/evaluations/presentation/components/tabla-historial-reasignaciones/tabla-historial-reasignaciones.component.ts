import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AssignmentHistoryEntry } from '@domain/entities/peer-evaluation.entity';

@Component({
  selector: 'app-tabla-historial-reasignaciones',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './tabla-historial-reasignaciones.component.html',
  styleUrls: ['./tabla-historial-reasignaciones.component.scss']
})
export class TablaHistorialReasignacionesComponent {
  @Input() historyRecords: AssignmentHistoryEntry[] | any[] = [];
}
