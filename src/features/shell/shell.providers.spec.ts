import { TestBed } from '@angular/core/testing';
import { Provider } from '@angular/core';
import { appConfig } from '@app/app.config';
import { MenuConfigPort } from '@domain/ports/menu-config.port';
import { GetPendingCountUseCase } from './application/get-pending-count.use-case';
import { GetMenuForRoleUseCase } from './application/get-menu-for-role.use-case';
import { PendingCountPort } from './domain/pending-count.port';
import { SHELL_PROVIDERS } from './shell.providers';

const provides = (providers: Provider[], token: unknown): boolean =>
  providers.some((p) => typeof p === 'object' && p !== null && 'provide' in p && p.provide === token);

describe('Proveedores del shell en la app real', () => {
  it('con appConfig no hay fuente de pendientes: el contador emite null (sin mock)', () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers, ...SHELL_PROVIDERS] });
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

  it('MenuConfigPort se registra en un solo lugar (app.config.ts, no SHELL_PROVIDERS)', () => {
    expect(provides(appConfig.providers as Provider[], MenuConfigPort)).toBeTrue();
    expect(provides(SHELL_PROVIDERS, MenuConfigPort)).toBeFalse();
  });

  it('ningún registro de la app real provee PendingCountPort', () => {
    expect(provides(appConfig.providers as Provider[], PendingCountPort)).toBeFalse();
    expect(provides(SHELL_PROVIDERS, PendingCountPort)).toBeFalse();
  });
});
