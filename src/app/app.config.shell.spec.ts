import { TestBed } from '@angular/core/testing';
import { Provider } from '@angular/core';
import { appConfig } from './app.config';
import { MenuConfigPort } from '@domain/ports/menu-config.port';
import { GetPendingCountUseCase } from '@features/shell/application/get-pending-count.use-case';
import { GetMenuForRoleUseCase } from '@features/shell/application/get-menu-for-role.use-case';
import { PendingCountPort } from '@features/shell/domain/pending-count.port';

const provides = (providers: Provider[], token: unknown): boolean =>
  providers.some((p) => typeof p === 'object' && p !== null && 'provide' in p && p.provide === token);

describe('Proveedores del shell en la app real', () => {
  it('con appConfig no hay fuente de pendientes: el contador emite null (sin mock)', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    let count: number | null | undefined;

    TestBed.inject(GetPendingCountUseCase)
      .execute()
      .subscribe((c) => (count = c));

    expect(count).toBeNull();
  });

  it('con appConfig, GetMenuForRoleUseCase da las 5 entradas de SECRETARIA', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(GetMenuForRoleUseCase).execute('SECRETARIA').length).toBe(5);
  });

  it('MenuConfigPort se registra en app.config.ts', () => {
    expect(provides(appConfig.providers as Provider[], MenuConfigPort)).toBeTrue();
  });

  it('ningún registro de la app real provee PendingCountPort', () => {
    expect(provides(appConfig.providers as Provider[], PendingCountPort)).toBeFalse();
  });
});
