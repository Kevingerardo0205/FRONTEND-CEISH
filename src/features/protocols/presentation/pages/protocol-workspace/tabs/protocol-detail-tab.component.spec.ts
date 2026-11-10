import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';

import { ProtocolDetailTabPage } from './protocol-detail-tab.component';
import { ProtocolWorkspaceService } from '../../../../application/services/protocol-workspace.service';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { AuditUseCase } from '@features/audit/application/use-cases/audit.use-case';

describe('ProtocolDetailTabPage - edicion de protocolo', () => {
  let page: ProtocolDetailTabPage;
  let protocolSignal: WritableSignal<ProtocolEntity | null>;

  beforeEach(async () => {
    protocolSignal = signal<ProtocolEntity | null>(null);
    await TestBed.configureTestingModule({
      imports: [ProtocolDetailTabPage],
      providers: [
        {
          provide: ProtocolWorkspaceService,
          useValue: { protocol: protocolSignal, evaluations: signal([]) },
        },
        {
          provide: AuthFacade,
          useValue: { currentUser: () => ({ rol: 'INVESTIGADOR' }) },
        },
        {
          provide: AuditUseCase,
          useValue: {
            getProtocolTrail: jasmine.createSpy('getProtocolTrail').and.returnValue(of([])),
          },
        },
      ],
    })
      .overrideComponent(ProtocolDetailTabPage, { set: { template: '' } })
      .compileComponents();

    page = TestBed.createComponent(ProtocolDetailTabPage).componentInstance;
  });

  function setStatus(status: string): void {
    protocolSignal.set({
      id: '5',
      title: 'Estudio de prueba del investigador',
      investigatorId: '30',
      status,
      type: 'INVESTIGACION',
      documents: [],
      version: 1,
    } as unknown as ProtocolEntity);
  }

  it('rol INVESTIGADOR y BORRADOR devuelve isEditable false sin distinguir mayusculas', () => {
    setStatus('BORRADOR');
    expect(page.isEditable()).toBeFalse();

    setStatus('borrador');
    expect(page.isEditable()).toBeFalse();
  });

  it('rol INVESTIGADOR y INCOMPLETO conserva isEditable true', () => {
    setStatus('INCOMPLETO');
    expect(page.isEditable()).toBeTrue();
  });
});

