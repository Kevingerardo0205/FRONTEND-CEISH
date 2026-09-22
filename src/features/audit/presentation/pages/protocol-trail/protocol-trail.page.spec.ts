import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ProtocolTrailPage } from './protocol-trail.page';
import { AuditUseCase } from '../../../application/use-cases/audit.use-case';
import { ProtocolTrailEvent } from '../../../domain/entities/audit.entity';

describe('ProtocolTrailPage', () => {
  let component: ProtocolTrailPage;
  let fixture: ComponentFixture<ProtocolTrailPage>;
  let mockAuditUseCase: jasmine.SpyObj<AuditUseCase>;

  const mockEvents: ProtocolTrailEvent[] = [
    {
      id: 'tr-1',
      date: new Date(),
      responsible: 'Dr. Investigador',
      action: 'Creación de Protocolo',
      status: 'COMPLETED',
      comments: 'Expediente inicial cargado',
      documents: [{ name: 'Doc.pdf', url: '#' }],
      integrityHash: 'sha256-mock'
    }
  ];

  beforeEach(async () => {
    mockAuditUseCase = jasmine.createSpyObj<AuditUseCase>('AuditUseCase', ['getProtocolTrail']);
    mockAuditUseCase.getProtocolTrail.and.returnValue(of(mockEvents));

    await TestBed.configureTestingModule({
      imports: [
        ProtocolTrailPage,
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { id: 'PRT-2026-001' }
            }
          }
        },
        { provide: AuditUseCase, useValue: mockAuditUseCase }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProtocolTrailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load protocol trail events', () => {
    expect(component).toBeTruthy();
    expect(component.protocolId).toBe('PRT-2026-001');
    expect(component.events.length).toBe(1);
    expect(mockAuditUseCase.getProtocolTrail).toHaveBeenCalledWith('PRT-2026-001');
  });

  it('should return correct status icon', () => {
    expect(component.getStatusIcon('COMPLETED')).toBe('check_circle');
    expect(component.getStatusIcon('CONDITIONED')).toBe('warning');
    expect(component.getStatusIcon('REJECTED')).toBe('cancel');
    expect(component.getStatusIcon('OTHER')).toBe('radio_button_checked');
  });
});
