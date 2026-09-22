import { InjectionToken } from '@angular/core';
import { ICallRepositoryPort } from 'src/domain/evaluations/icall-repository.port';

export const CALL_REPOSITORY_TOKEN = new InjectionToken<ICallRepositoryPort>(
  'CALL_REPOSITORY_TOKEN'
);
