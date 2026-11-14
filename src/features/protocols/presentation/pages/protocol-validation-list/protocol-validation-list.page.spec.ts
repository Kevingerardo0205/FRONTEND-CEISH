import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProtocolValidationListPage } from './protocol-validation-list.page';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('ProtocolValidationListPage', () => {
  let component: ProtocolValidationListPage;
  let fixture: ComponentFixture<ProtocolValidationListPage>;
  let mockProtocolRepo: jasmine.SpyObj<IProtocolRepositoryPort>;
  let mockNotificationBroker: jasmine.SpyObj<NotificationBrokerService>;

  beforeEach(async () => {
    mockProtocolRepo = jasmine.createSpyObj('IProtocolRepositoryPort', ['getReceptionProtocols']);
    mockNotificationBroker = jasmine.createSpyObj('NotificationBrokerService', ['on']);

    mockProtocolRepo.getReceptionProtocols.and.returnValue(of([]));
    mockNotificationBroker.on.and.returnValue(of());

    await TestBed.configureTestingModule({
      imports: [ProtocolValidationListPage],
      providers: [
        { provide: IProtocolRepositoryPort, useValue: mockProtocolRepo },
        { provide: NotificationBrokerService, useValue: mockNotificationBroker },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {} },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProtocolValidationListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe clasificar los protocolos correctamente según su estado', () => {
    const mockProtocols = [
      {
        id: '1',
        title: 'Protocolo 1',
        status: 'INICIADO',
        submissionDate: '2026-08-25T00:00:00Z',
        code: 'P1',
        version: 1,
      },
      {
        id: '2',
        title: 'Protocolo 2',
        status: 'EN_CONTROL_DOCUMENTAL',
        submissionDate: '2026-08-25T00:00:00Z',
        code: 'P2',
        version: 2,
      },
      {
        id: '3',
        title: 'Protocolo 3',
        status: 'INCOMPLETO',
        submissionDate: '2026-08-25T00:00:00Z',
        code: 'P3',
        version: 1,
      },
    ];

    mockProtocolRepo.getReceptionProtocols.and.returnValue(of(mockProtocols as any));
    component.loadProtocols();

    // Pendientes: INICIADO y EN_CONTROL_DOCUMENTAL
    expect(component.pendingProtocols().length).toBe(2);
    expect(component.pendingProtocols()[0].id).toBe('1');
    expect(component.pendingProtocols()[1].id).toBe('2');

    // Observados: INCOMPLETO
    expect(component.observedProtocols().length).toBe(1);
    expect(component.observedProtocols()[0].id).toBe('3');
  });
});
