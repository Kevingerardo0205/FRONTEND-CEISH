import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadPendingPeerAssignmentProtocolsUseCase } from '@features/evaluations/application/load-pending-peer-assignment-protocols.use-case';
import { WorkflowTableComponent } from '../../components/workflow-table/workflow-table.component';
import { SecretariatDashboardService } from './application/services/secretariat-dashboard.service';
import { DashboardSecretariaPage } from './dashboard-secretaria.page';

@Component({ selector: 'app-workflow-table', standalone: true, template: '' })
class WorkflowTableStubComponent {
  readonly protocols = input<unknown[]>([]);
  readonly filterChanged = output<string>();
}

describe('DashboardSecretariaPage (F03 D10 (2))', () => {
  let loadPending: jasmine.Spy;
  let loadDashboardData: jasmine.Spy;

  beforeEach(async () => {
    loadPending = jasmine.createSpy('execute').and.returnValue(of([]));
    loadDashboardData = jasmine.createSpy('loadDashboardData').and.returnValue(of(null));
    const service = {
      isLoading: signal(false),
      searchQuery: signal(''),
      metrics: signal(null),
      protocols: signal([]),
      filteredProtocols: signal([]),
      loadDashboardData,
      updateSearch: jasmine.createSpy('updateSearch'),
      updateFilter: jasmine.createSpy('updateFilter'),
    };
    await TestBed.configureTestingModule({
      imports: [DashboardSecretariaPage],
      providers: [{ provide: LoadPendingPeerAssignmentProtocolsUseCase, useValue: { execute: loadPending } }],
    })
      .overrideComponent(DashboardSecretariaPage, {
        remove: { imports: [WorkflowTableComponent], providers: [SecretariatDashboardService] },
        add: {
          imports: [WorkflowTableStubComponent],
          providers: [{ provide: SecretariatDashboardService, useValue: service }],
        },
      })
      .compileComponents();
  });

  it('muestra solo la bandeja de trámites: sin la pestaña «Estratificación de Riesgo» ni la carga de pares', () => {
    const fixture = TestBed.createComponent(DashboardSecretariaPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('app-workflow-table')).not.toBeNull();
    expect(root.textContent).not.toContain('Estratificación de Riesgo');
    expect(root.querySelector('app-peer-risk-pending-table')).toBeNull();
    expect(root.querySelector('.view-selector')).toBeNull();
    expect(loadDashboardData).toHaveBeenCalledTimes(1);
    expect(loadPending).not.toHaveBeenCalled();
  });
});
