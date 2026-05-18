import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssignmentPage } from './assignment.page';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { GetEvaluatorsDashboardUseCase } from '../../../application/get-evaluators-dashboard.use-case';
import { SuggestEvaluatorsUseCase } from '../../../application/suggest-evaluators.use-case';
import { ConfirmAssignmentUseCase } from '../../../application/confirm-assignment.use-case';
import { of } from 'rxjs';
import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

describe('AssignmentPage', () => {
  let component: AssignmentPage;
  let fixture: ComponentFixture<AssignmentPage>;
  let authFacadeSpy: jasmine.SpyObj<AuthFacade>;
  let getDashboardUCSpy: jasmine.SpyObj<GetEvaluatorsDashboardUseCase>;

  beforeEach(async () => {
    authFacadeSpy = jasmine.createSpyObj('AuthFacade', [], {
      currentUser: signal({ id: '1', nombre: 'Admin', rol: 'ADMIN' })
    });

    getDashboardUCSpy = jasmine.createSpyObj('GetEvaluatorsDashboardUseCase', ['execute']);
    getDashboardUCSpy.execute.and.returnValue(of({
      pendingProtocols: [
        { protocolId: 'p1', protocolCode: '2026-IO-001', protocolTitle: 'Test IO', type: ProtocolType.IO },
        { protocolId: 'p2', protocolCode: '2026-EC-005', protocolTitle: 'Test EC', type: ProtocolType.EC }
      ],
      evaluators: [
        { id: 'e1', nombre: 'Eval 1', perfil: 'JURIDICO', cargaActiva: 0 },
        { id: 'e2', nombre: 'Eval 2', perfil: 'SALUD', cargaActiva: 1 },
        { id: 'e3', nombre: 'Eval 3', perfil: 'METODOLOGIA', cargaActiva: 2 },
        { id: 'e4', nombre: 'Eval 4', perfil: 'BIOETICA', cargaActiva: 0 },
        { id: 'e5', nombre: 'Eval 5', perfil: 'SOCIEDAD_CIVIL', cargaActiva: 0 }
      ],
      suggestedEvaluations: []
    }));

    await TestBed.configureTestingModule({
      imports: [AssignmentPage, NoopAnimationsModule],
      providers: [
        { provide: AuthFacade, useValue: authFacadeSpy },
        { provide: GetEvaluatorsDashboardUseCase, useValue: getDashboardUCSpy },
        { provide: SuggestEvaluatorsUseCase, useValue: jasmine.createSpyObj('SuggestEvaluatorsUseCase', ['execute']) },
        { provide: ConfirmAssignmentUseCase, useValue: jasmine.createSpyObj('ConfirmAssignmentUseCase', ['execute']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AssignmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente y cargar datos del dashboard', () => {
    expect(component).toBeTruthy();
    expect(component.pendingProtocols().length).toBe(2);
    expect(component.evaluators().length).toBe(5);
  });

  it('debe identificar correctamente el tipo de revisión', () => {
    expect(component.getReviewType(ProtocolType.IO)).toBe('EXPEDITA');
    expect(component.getReviewType(ProtocolType.EC)).toBe('PLENO');
  });

  it('debe validar que una revisión EXPEDITA requiere exactamente 2 evaluadores', () => {
    const protocolIO = component.pendingProtocols().find(p => p.type === ProtocolType.IO);
    
    protocolIO.selectedEvaluatorIds = ['e1'];
    expect(component.isValidAssignment(protocolIO)).toBeFalse();

    protocolIO.selectedEvaluatorIds = ['e1', 'e2'];
    expect(component.isValidAssignment(protocolIO)).toBeTrue();
  });

  it('debe validar que una revisión PLENO requiere exactamente 5 evaluadores con perfiles PET únicos', () => {
    const protocolEC = component.pendingProtocols().find(p => p.type === ProtocolType.EC);
    
    // 5 evaluadores pero perfiles repetidos
    protocolEC.selectedEvaluatorIds = ['e1', 'e2', 'e3', 'e4', 'e1']; 
    expect(component.isValidAssignment(protocolEC)).toBeFalse();

    // 5 evaluadores con los 5 perfiles requeridos
    protocolEC.selectedEvaluatorIds = ['e1', 'e2', 'e3', 'e4', 'e5'];
    expect(component.isValidAssignment(protocolEC)).toBeTrue();
  });

  it('debe marcar perfiles como cubiertos dinámicamente', () => {
    const protocolEC = component.pendingProtocols().find(p => p.type === ProtocolType.EC);
    
    expect(component.isProfileCovered(protocolEC, 'JURIDICO')).toBeFalse();
    
    protocolEC.selectedEvaluatorIds = ['e1']; // e1 es JURIDICO
    expect(component.isProfileCovered(protocolEC, 'JURIDICO')).toBeTrue();
    expect(component.isProfileCovered(protocolEC, 'SALUD')).toBeFalse();
  });
});
