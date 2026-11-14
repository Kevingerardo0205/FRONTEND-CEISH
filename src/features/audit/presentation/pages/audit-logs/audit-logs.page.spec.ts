import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuditLogsPage } from './audit-logs.page';
import { AuditUseCase } from '../../../application/use-cases/audit.use-case';
import { AuditLog } from '../../../domain/entities/audit.entity';

describe('AuditLogsPage', () => {
  let component: AuditLogsPage;
  let fixture: ComponentFixture<AuditLogsPage>;
  let mockAuditUseCase: jasmine.SpyObj<AuditUseCase>;

  const mockLogs: AuditLog[] = [
    {
      id: 'aud-1',
      timestamp: new Date(),
      userId: '1',
      userName: 'Admin User',
      userRole: 'ADMIN_TI',
      action: 'UPDATE',
      entity: 'User',
      recordId: 'USR-001',
      ipAddress: '192.168.1.1',
      changes: {
        before: { active: true },
        after: { active: false },
      },
    },
  ];

  beforeEach(async () => {
    mockAuditUseCase = jasmine.createSpyObj<AuditUseCase>('AuditUseCase', ['getLogs']);
    mockAuditUseCase.getLogs.and.returnValue(of(mockLogs));

    await TestBed.configureTestingModule({
      imports: [AuditLogsPage, NoopAnimationsModule],
      providers: [{ provide: AuditUseCase, useValue: mockAuditUseCase }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial logs', () => {
    expect(component).toBeTruthy();
    expect(component.logs.length).toBe(1);
    expect(mockAuditUseCase.getLogs).toHaveBeenCalled();
  });

  it('should toggle changes overlay when log is selected', () => {
    component.toggleChanges(mockLogs[0]);
    expect(component.selectedLog).toEqual(mockLogs[0]);
  });
});
