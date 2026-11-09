import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';

import { NuevoProtocoloPage } from './nuevo-protocolo.page';
import { ProtocoloService } from '../../../application/services/protocolo.service';
import { AuthFacade } from '@features/auth/facades/auth.facade';

/**
 * Campos que acepta CreateProtocolDto del backend
 * (src/modules/protocols/application/dtos/create-protocol.dto.ts). El GlobalValidationPipe
 * usa whitelist + forbidNonWhitelisted: cualquier otra propiedad responde 400.
 */
const CAMPOS_CREATE_PROTOCOL_DTO = [
  'title',
  'principalInvestigatorId',
  'studyTypeId',
  'version',
  'financingAmount',
  'financingSources',
  'sponsorRuc',
  'sponsorPhone',
  'sponsorAddress',
  'sponsorWeb',
  'sponsorExecutingAgency',
  'estimatedStartDate',
  'estimatedEndDate',
  'geographicCoverage',
  'studyDurationMonths',
  'isVulnerablePopulation',
  'usesBiologicalSamples',
  'isMulticentric',
  'hasExternalInstitutions',
  'isIndigenousPopulation',
  'isAffidavitAccepted',
  'investigators',
  'institutions',
];

describe('NuevoProtocoloPage — cuerpo de POST /protocols', () => {
  let guardarSpy: jasmine.Spy;

  beforeEach(async () => {
    guardarSpy = jasmine.createSpy('guardarProtocoloInicial').and.returnValue(NEVER);

    await TestBed.configureTestingModule({
      imports: [NuevoProtocoloPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ProtocoloService,
          useValue: { guardarProtocoloInicial: guardarSpy, getStudyTypes: () => NEVER },
        },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30 }) } },
      ],
    })
      .overrideComponent(NuevoProtocoloPage, { set: { template: '' } })
      .compileComponents();
  });

  function enviarFormularioValido(): Record<string, unknown> {
    const page = TestBed.createComponent(NuevoProtocoloPage).componentInstance;
    page.generalForm.patchValue({
      titulo: 'ZZ_TEST_ Protocolo de prueba sin nivel de riesgo',
      tipoEstudio: '2',
      isAffidavitAccepted: true,
      usesBiologicalSamples: true,
    });
    page.guardarInicial();
    expect(guardarSpy).toHaveBeenCalledTimes(1);
    return guardarSpy.calls.mostRecent().args[0] as Record<string, unknown>;
  }

  it('no envía riskLevelId (lo definen los pares evaluadores después de la asignación)', () => {
    const body = enviarFormularioValido();
    expect(Object.prototype.hasOwnProperty.call(body, 'riskLevelId')).toBeFalse();
  });

  it('solo envía campos que acepta CreateProtocolDto', () => {
    const body = enviarFormularioValido();
    const sobrantes = Object.keys(body).filter((k) => !CAMPOS_CREATE_PROTOCOL_DTO.includes(k));
    expect(sobrantes).toEqual([]);
  });

  it('envía los campos obligatorios del DTO con sus tipos', () => {
    const body = enviarFormularioValido();
    expect(body['title']).toBe('ZZ_TEST_ Protocolo de prueba sin nivel de riesgo');
    expect(body['principalInvestigatorId']).toBe(30);
    expect(body['studyTypeId']).toBe(2);
    expect(body['isAffidavitAccepted']).toBeTrue();
    expect(body['usesBiologicalSamples']).toBeTrue();
    expect(body['investigators']).toEqual([]);
    expect(body['institutions']).toEqual([]);
  });
});
