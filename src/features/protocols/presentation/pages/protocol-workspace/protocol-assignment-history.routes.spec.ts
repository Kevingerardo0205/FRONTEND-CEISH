import { Route } from '@angular/router';
import { PROTOCOL_ROUTES } from '../../../routes';

describe('workspace assignment consultation routes', () => {
  function workspaceChildren(): readonly Route[] {
    const root = PROTOCOL_ROUTES.find((route) => route.path === '');
    const workspace = root?.children?.find((route) => route.path === 'workspace/:id');
    return (workspace?.children ?? []) as unknown as readonly Route[];
  }

  it('separates the read-only assignment consultation route from the EP2b operation route', () => {
    const children = workspaceChildren();
    const consultation = children.find((route) => route['path'] === 'assignment-history');
    const operation = children.find((route) => route['path'] === 'assignment');
    const consultationData = consultation?.['data'] as Record<string, unknown> | undefined;
    const operationData = operation?.['data'] as Record<string, unknown> | undefined;

    expect(consultationData?.['roles']).toEqual(['SECRETARIA', 'PRESIDENTE', 'INVESTIGADOR']);
    expect(consultationData?.['permissions']).toBeUndefined();
    expect(operationData?.['roles']).toEqual(['PRESIDENTE']);
    expect(operationData?.['permissions']).toEqual(['EVALUACION_ASIGNAR']);
  });
});
