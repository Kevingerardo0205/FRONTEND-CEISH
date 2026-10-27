import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TablaHistorialReasignacionesComponent } from './tabla-historial-reasignaciones.component';
import { AssignmentHistoryEntry } from '@domain/entities/peer-evaluation.entity';

describe('TablaHistorialReasignacionesComponent (RF-12.3)', () => {
  let component: TablaHistorialReasignacionesComponent;
  let fixture: ComponentFixture<TablaHistorialReasignacionesComponent>;

  const mockRecords: AssignmentHistoryEntry[] = [
    {
      id: 501,
      assignmentId: 101,
      previousEvaluatorId: 10,
      previousEvaluatorName: 'Dr. Fernando Morales',
      newEvaluatorId: 15,
      newEvaluatorName: 'Dra. Gabriela Castro',
      evaluatorProfile: 'JURIDICO',
      reassignmentReason: 'CONFLICTO_INTERES',
      reasonDescription: 'Parentesco con el investigador principal.',
      executedByUserId: 1,
      executedByUserName: 'Administrador CEISH',
      executedAt: '2026-09-28T15:30:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaHistorialReasignacionesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TablaHistorialReasignacionesComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render table rows with audit data when history records exist (RF-12.3)', () => {
    component.historyRecords = mockRecords;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);

    expect(compiled.textContent).toContain('Dr. Fernando Morales');
    expect(compiled.textContent).toContain('Dra. Gabriela Castro');
    expect(compiled.textContent).toContain('CONFLICTO_INTERES');
    expect(compiled.textContent).toContain('Parentesco con el investigador principal.');
    expect(compiled.textContent).toContain('Administrador CEISH');
    expect(compiled.textContent).toContain('JURIDICO');
  });

  it('should show empty state message when there are no history records', () => {
    component.historyRecords = [];
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(0);
    expect(compiled.textContent).toContain('No se registran reasignaciones');
  });
});
