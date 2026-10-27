import { ENDPOINTS } from './endpoints.constant';

describe('ENDPOINTS Constant (Infrastructure)', () => {
  it('should define REASSIGN and HISTORY endpoints for RF-12.3', () => {
    expect(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.REASSIGN).toBe('/evaluations/reassign');
    expect(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.HISTORY('42')).toBe(
      '/evaluations/protocol/42/reassignment-history',
    );
  });

  it('should define ACTIVE_ASSIGNMENTS with numeric protocolId', () => {
    expect(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.ACTIVE_ASSIGNMENTS(119)).toBe(
      '/evaluations/protocol/119/active-assignments',
    );
  });

  it('should preserve existing PEER_ASSIGNMENTS endpoints', () => {
    expect(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.PENDING_ASSIGNMENT).toBe(
      '/evaluations/protocols/pending-peer-assignment',
    );
    expect(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.ASSIGN_PEERS('10')).toBe(
      '/evaluations/protocols/10/assign-peer-evaluators',
    );
    expect(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.MY_PENDING).toBe(
      '/evaluations/peer-assignments/my-pending',
    );
    expect(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.SUBMIT_RISK('5')).toBe(
      '/evaluations/peer-assignments/5/submit-risk',
    );
    expect(ENDPOINTS.EVALUATIONS.PEER_ASSIGNMENTS.ACTIVE_EVALUATORS).toBe(
      '/evaluations/evaluators/active',
    );
  });
});
