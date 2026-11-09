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

describe('NuevoProtocoloPage — template del título', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoProtocoloPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ProtocoloService,
          useValue: { guardarProtocoloInicial: () => NEVER, getStudyTypes: () => NEVER },
        },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30 }) } },
      ],
    }).compileComponents();
  });

  function render(titulo: string) {
    const fixture = TestBed.createComponent(NuevoProtocoloPage);
    fixture.detectChanges();
    const control = fixture.componentInstance.generalForm.controls.titulo;
    control.setValue(titulo);
    control.markAsTouched();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { control, el, textarea: el.querySelector('textarea') as HTMLTextAreaElement };
  }

  it('con 201 caracteres reales muestra "Máximo 200 caracteres"', () => {
    const { el } = render('a'.repeat(201));
    expect(el.textContent).toContain('Máximo 200 caracteres');
  });

  it('el textarea limita a 200 en el navegador sin contar los espacios alrededor como error', () => {
    const { control, el, textarea } = render(`  ${'a'.repeat(200)}  `);
    expect(textarea.getAttribute('maxlength')).toBe('200');
    expect(control.valid).toBeTrue();
    expect(el.textContent).not.toContain('Máximo 200 caracteres');
  });
});

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

  describe('título recortado', () => {
    const VEINTE = 'Anemia en Riobamba 1'; // 20 caracteres
    const DIECINUEVE = VEINTE.slice(0, 19);

    function control() {
      return TestBed.createComponent(NuevoProtocoloPage).componentInstance.generalForm.controls
        .titulo;
    }

    it('el control arranca en vacío', () => {
      expect(control().value).toBe('');
    });

    it('un título de solo espacios no es válido', () => {
      const c = control();
      c.setValue('   ');
      expect(c.valid).toBeFalse();
      expect(c.hasError('required')).toBeTrue();
    });

    it('19 caracteres reales con espacios alrededor no es válido', () => {
      const c = control();
      c.setValue(`      ${DIECINUEVE}      `);
      expect(c.valid).toBeFalse();
      expect(c.hasError('minlength')).toBeTrue();
    });

    it('más de 200 caracteres reales no es válido; 200 con espacios alrededor sí', () => {
      const c = control();
      c.setValue('a'.repeat(201));
      expect(c.hasError('maxlength')).toBeTrue();
      c.setValue(`  ${'a'.repeat(200)}  `);
      expect(c.valid).toBeTrue();
    });

    it('20 caracteres con espacios alrededor es válido y se envía sin espacios', () => {
      const page = TestBed.createComponent(NuevoProtocoloPage).componentInstance;
      page.generalForm.patchValue({
        titulo: `   ${VEINTE}  \n`,
        tipoEstudio: '2',
        isAffidavitAccepted: true,
      });
      expect(page.generalForm.controls.titulo.valid).toBeTrue();
      page.guardarInicial();
      expect(guardarSpy).toHaveBeenCalledTimes(1);
      expect((guardarSpy.calls.mostRecent().args[0] as { title: string }).title).toBe(VEINTE);
    });
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
