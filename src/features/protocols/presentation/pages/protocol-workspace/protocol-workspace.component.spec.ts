import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { ProtocolWorkspaceComponent } from './protocol-workspace.component';
import { ProtocolWorkspaceService } from '../../../application/services/protocol-workspace.service';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { AuthFacade } from '@features/auth/facades/auth.facade';

describe('ProtocolWorkspaceComponent - acciones contextuales', () => {
  let page: ProtocolWorkspaceComponent;
  let protocolSignal: WritableSignal<ProtocolEntity | null>;

  beforeEach(async () => {
    protocolSignal = signal<ProtocolEntity | null>(null);
    const workspace = {
      protocol: protocolSignal,
      evaluations: signal([]),
      loadProtocol: jasmine.createSpy('loadProtocol').and.returnValue(of(null)),
      updateProtocol: jasmine.createSpy('updateProtocol'),
    };

    await TestBed.configureTestingModule({
      imports: [ProtocolWorkspaceComponent],
      providers: [
        { provide: ProtocolWorkspaceService, useValue: workspace },
        {
          provide: AuthFacade,
          useValue: {
            currentUser: () => ({ rol: 'INVESTIGADOR' }),
            hasRole: (role: string) => role === 'INVESTIGADOR',
          },
        },
        { provide: ActivatedRoute, useValue: { params: of({}) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
      ],
    })
      .overrideComponent(ProtocolWorkspaceComponent, {
        set: {
          template: '',
          providers: [{ provide: ProtocolWorkspaceService, useValue: workspace }],
        },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(ProtocolWorkspaceComponent);
    page = fixture.componentInstance;
    fixture.detectChanges();
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

  it('INVESTIGADOR con BORRADOR no recibe EDIT_PROTOCOL incluso con distinto uso de mayusculas', () => {
    setStatus('BORRADOR');
    expect(page.contextualActions().some((action) => action.id === 'EDIT_PROTOCOL')).toBeFalse();

    setStatus('borrador');
    expect(page.contextualActions().some((action) => action.id === 'EDIT_PROTOCOL')).toBeFalse();
  });

  it('INVESTIGADOR con INCOMPLETO conserva EDIT_PROTOCOL', () => {
    setStatus('INCOMPLETO');
    expect(page.contextualActions().some((action) => action.id === 'EDIT_PROTOCOL')).toBeTrue();
  });
});

