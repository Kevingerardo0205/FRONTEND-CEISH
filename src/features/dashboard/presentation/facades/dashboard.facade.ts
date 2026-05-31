import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, of, catchError, map } from 'rxjs';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { IUserAdminRepositoryPort } from '@domain/ports/user-admin-repository.port';
import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { ProtocoloService } from '@features/investigador/application/services/protocolo.service';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private authFacade = inject(AuthFacade);
  private protocolRepo = inject(IProtocolRepositoryPort);
  private userAdminRepo = inject(IUserAdminRepositoryPort);
  private evalRepo = inject(IEvaluationRepositoryPort);
  private investigatorService = inject(ProtocoloService);

  // Signals para las estadísticas reales
  private usersCountSignal = signal<number>(0);
  private protocolsCountSignal = signal<number>(0);
  private pendingValidationCountSignal = signal<number>(0);
  private myProtocolsSignal = signal<any[]>([]);

  public usersCount = this.usersCountSignal.asReadonly();
  public protocolsCount = this.protocolsCountSignal.asReadonly();
  public pendingValidationCount = this.pendingValidationCountSignal.asReadonly();
  public myProtocols = this.myProtocolsSignal.asReadonly();

  // Estadísticas calculadas para Investigador de forma resiliente
  public myObservedCount = computed(() => {
    const protocols = this.myProtocols();
    return Array.isArray(protocols) 
      ? protocols.filter(p => p.estado === 'REQUIERE_CORRECCION').length 
      : 0;
  });
  public myApprovedCount = computed(() => {
    const protocols = this.myProtocols();
    return Array.isArray(protocols) 
      ? protocols.filter(p => ['APROBADO_DEFINITIVO', 'APROBADO_CONDICIONADO'].includes(p.estado)).length 
      : 0;
  });

  public loadStats() {
    const role = this.authFacade.currentUser()?.rol?.toUpperCase();

    if (role === 'ADMIN') {
      this.userAdminRepo.getAll().pipe(
        catchError(() => of([]))
      ).subscribe(users => this.usersCountSignal.set(users.length));
    }

    if (role === 'INVESTIGADOR') {
      this.investigatorService.misProtocolos().pipe(
        catchError(() => of([]))
      ).subscribe(protocols => this.myProtocolsSignal.set(protocols));
    }

    if (role === 'SECRETARIA' || role === 'PRESIDENTA') {
      this.protocolRepo.getReceptionProtocols().pipe(
        catchError(() => of([]))
      ).subscribe(protocols => {
        this.protocolsCountSignal.set(protocols.length);
        this.pendingValidationCountSignal.set(
          protocols.filter(p => ['SUBMITTED', 'PENDIENTE', 'EN_REVISION_SECRETARIA'].includes(p.status)).length
        );
      });
    }
  }
}
