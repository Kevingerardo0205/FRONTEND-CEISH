import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarjetaEvaluadorComponent } from './tarjeta-evaluador.component';
import { ActiveAssignment } from '@domain/entities/peer-evaluation.entity';
import { ACTIVE_ASSIGNMENTS_119_BODY } from '../../../testing/reassignment.fixtures';

describe('TarjetaEvaluadorComponent (RF-12.1, RF-12.2, RF-12.3)', () => {
  let component: TarjetaEvaluadorComponent;
  let fixture: ComponentFixture<TarjetaEvaluadorComponent>;

  // Asignación real 6 del protocolo 119 (Ana Karina Albuja Landi, deadline "2026-06-23").
  const realAssignment = ACTIVE_ASSIGNMENTS_119_BODY.data.assignments[0] as ActiveAssignment;

  function render(assignment: ActiveAssignment, showReassignAction = false): HTMLElement {
    component.assignment = assignment;
    component.showReassignAction = showReassignAction;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaEvaluadorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaEvaluadorComponent);
    component = fixture.componentInstance;
  });

  it('muestra nombre, perfil y estado en español de la asignación real', () => {
    const el = render(realAssignment);
    expect(el.textContent).toContain('Ana Karina Albuja Landi');
    expect(el.querySelector('.badge-profile')?.textContent?.trim()).toBe('METODOLOGICO');
    expect(el.querySelector('.badge-status')?.textContent?.trim()).toBe('Asignado');
  });

  it('muestra el plazo "2026-06-23" como 23/06/2026 (fecha local, no el día 22)', () => {
    const el = render(realAssignment);
    expect(el.querySelector('.deadline-value')?.textContent?.trim()).toBe('23/06/2026');
  });

  it('deadline null → muestra la fila con "Pendiente de convocatoria"', () => {
    const el = render({ ...realAssignment, deadlineDate: null });
    expect(el.querySelector('.assignment-meta')).toBeTruthy();
    expect(el.querySelector('.deadline-value')?.textContent?.trim()).toBe('Pendiente de convocatoria');
  });

  it('etiquetas de estado SUGGESTED y COMPLETED', () => {
    expect(render({ ...realAssignment, status: 'SUGGESTED' }).querySelector('.badge-status')?.textContent?.trim()).toBe('Sugerido');
    expect(render({ ...realAssignment, status: 'COMPLETED' }).querySelector('.badge-status')?.textContent?.trim()).toBe('Completado');
  });

  it('perfil null → "Sin perfil"', () => {
    const el = render({ ...realAssignment, evaluatorProfile: null });
    expect(el.querySelector('.badge-profile')?.textContent?.trim()).toBe('Sin perfil');
  });

  it('muestra la insignia de Anexo 10 solo cuando isAssignedForAnnex10 es true', () => {
    expect(render(realAssignment).querySelector('.badge-annex10')).toBeFalsy();
    expect(render({ ...realAssignment, isAssignedForAnnex10: true }).querySelector('.badge-annex10')).toBeTruthy();
  });

  it('emite la asignación al pulsar "Reasignar" y oculta el botón si showReassignAction es false', () => {
    expect(render(realAssignment, false).querySelector('.btn-reassign')).toBeFalsy();

    let emitted: ActiveAssignment | undefined;
    component.reassignClick.subscribe((a: ActiveAssignment) => (emitted = a));
    (render(realAssignment, true).querySelector('.btn-reassign') as HTMLButtonElement).click();

    expect(emitted).toEqual(realAssignment);
  });
});
