import { EVALUATION_ROUTES } from './routes';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { RoleGuard } from '@infrastructure/guards/role.guard';
import { PeerAssignmentListPage } from './presentation/pages/peer-assignment-list/peer-assignment-list.page';
import { ReassignmentPage } from './presentation/pages/reassignment/reassignment.page';
import { EvaluationListPage } from './presentation/pages/evaluation-list/evaluation-list.page';
import { EvaluationFormPage } from './presentation/pages/evaluation-form/evaluation-form.page';
import { PeerRiskAssessmentPage } from './presentation/pages/peer-risk-assessment/peer-risk-assessment.page';
import { EvaluationConsolidationPage } from './presentation/pages/evaluation-consolidation/evaluation-consolidation.page';

describe('EVALUATION_ROUTES (Routing Architecture)', () => {
  const rootChildren = EVALUATION_ROUTES[0]?.children || [];

  it('assignment: solo PRESIDENTE con EVALUACION_ASIGNAR, carga perezosa (F03 D1)', () => {
    const route = rootChildren.find((r) => r.path === 'assignment');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();
    expect(route?.component).toBeUndefined();
    expect(route?.canActivate).toEqual([RoleGuard, AuthGuard]);
    expect(route?.data?.['roles']).toEqual(['PRESIDENTE']);
    expect(route?.data?.['permissions']).toEqual(['EVALUACION_ASIGNAR']);
  });

  it('assignment abre la lista de la PRESIDENTE (F03 §3)', async () => {
    const list = await rootChildren.find((r) => r.path === 'assignment')?.loadComponent?.();
    expect(list).toBe(PeerAssignmentListPage);
  });

  it('assignment/:protocolId ya no carga un formulario: redirige al formulario del espacio (EP2b)', () => {
    const route = rootChildren.find((r) => r.path === 'assignment/:protocolId');
    expect(route?.redirectTo).toBe('/dashboard/protocols/workspace/:protocolId/assignment');
    expect(route?.pathMatch).toBe('full');
    expect(route?.loadComponent).toBeUndefined();
    expect(route?.component).toBeUndefined();
  });

  it('should define route for evaluator reassignment by protocolId (RF-12.3)', () => {
    const route = rootChildren.find((r) => r.path === 'reassignment/:protocolId');
    expect(route).toBeDefined();
    expect(route?.component).toBe(ReassignmentPage);
    expect(route?.canActivate).toContain(AuthGuard);
    expect(route?.data?.['permissions']).toContain('EVALUATORS_ASSIGN');
    expect(route?.data?.['permissions']).toContain('EVALUACION_ASIGNAR');
  });

  it('should define alias route for evaluator reassignment by id (RF-12.3)', () => {
    const route = rootChildren.find((r) => r.path === 'reassign/:id');
    expect(route).toBeDefined();
    expect(route?.component).toBe(ReassignmentPage);
    expect(route?.canActivate).toContain(AuthGuard);
  });

  it('should define route for evaluation list', () => {
    const route = rootChildren.find((r) => r.path === 'list');
    expect(route).toBeDefined();
    expect(route?.component).toBe(EvaluationListPage);
    expect(route?.canActivate).toContain(AuthGuard);
  });

  it('should define route for peer evaluation form', () => {
    const route = rootChildren.find((r) => r.path === 'evaluate/:id');
    expect(route).toBeDefined();
    expect(route?.component).toBe(EvaluationFormPage);
    expect(route?.canActivate).toContain(AuthGuard);
  });

  it('should define route for peer risk assessment (Annex 10)', () => {
    const route = rootChildren.find((r) => r.path === 'evaluate-risk/:id');
    expect(route).toBeDefined();
    expect(route?.component).toBe(PeerRiskAssessmentPage);
    expect(route?.canActivate).toContain(AuthGuard);
  });

  it('should define route for evaluation consolidation', () => {
    const route = rootChildren.find((r) => r.path === 'consolidation/:id');
    expect(route).toBeDefined();
    expect(route?.component).toBe(EvaluationConsolidationPage);
    expect(route?.canActivate).toContain(AuthGuard);
  });
});
