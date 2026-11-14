import { Observable } from 'rxjs';

/** Cantidad de pendientes de la Secretaría para el contador del menú (spec-003 RF-ALR.f). */
export abstract class PendingCountPort {
  abstract readonly count$: Observable<number>;
}
