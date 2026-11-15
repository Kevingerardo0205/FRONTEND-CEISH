import { DebugElement } from '@angular/core';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { FocusMonitor } from '@angular/cdk/a11y';
import { BehaviorSubject, NEVER, Observable, of, Subject, throwError } from 'rxjs';

import { NuevoProtocoloPage } from './nuevo-protocolo.page';
import { ProtocoloService } from '../../../application/services/protocolo.service';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { ProtocoloResumen, EstadoProtocolo } from '../../../domain/dtos/crear-protocolo.dto';

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
  'isThesis',
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

  it('con 201 caracteres reales el título queda pendiente en el aviso, sin error debajo (C2b)', () => {
    const { control, el } = render('a'.repeat(201));
    expect(control.hasError('maxlength')).toBeTrue();
    expect(el.querySelector('#np-paso1-motivo')?.textContent).toContain('el título');
    expect(el.textContent).not.toContain('Máximo 200 caracteres');
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
      esTesis: false,
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
        esTesis: false,
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

describe('NuevoProtocoloPage — envío a la Secretaría (F09-2, F09-3)', () => {
  const MENSAJE_ESTADO =
    'El protocolo no se puede enviar en su estado actual: solo se envía un borrador o un protocolo con documentación incompleta o por subsanar.';

  let finalizarSpy: jasmine.Spy;
  let snackSpy: jasmine.Spy;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    finalizarSpy = jasmine.createSpy('finalizarProtocolo');

    await TestBed.configureTestingModule({
      imports: [NuevoProtocoloPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ProtocoloService,
          useValue: {
            guardarProtocoloInicial: () => NEVER,
            getStudyTypes: () => NEVER,
            finalizarProtocolo: finalizarSpy,
          },
        },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30 }) } },
      ],
    })
      .overrideComponent(NuevoProtocoloPage, { set: { template: '' } })
      .compileComponents();

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  function paginaListaParaEnviar(): NuevoProtocoloPage {
    const fixture = TestBed.createComponent(NuevoProtocoloPage);
    // MatSnackBarModule (importado por el componente) da su propia instancia: se espía esa.
    snackSpy = spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open');
    const page = fixture.componentInstance;
    page.protocolId = 7;
    page.documentosRequeridos = [];
    page.archivosCargados = { 'zz-test-documento.pdf': 'zz-test-documento.pdf' };
    return page;
  }

  it('201 → aviso "Protocolo enviado a la Secretaría." sin código CEISH y va a Mis protocolos', () => {
    finalizarSpy.and.returnValue(of({}));
    const page = paginaListaParaEnviar();

    page.onEnviarFinal();

    expect(finalizarSpy).toHaveBeenCalledOnceWith(7);
    expect(snackSpy).toHaveBeenCalledTimes(1);
    const texto = snackSpy.calls.mostRecent().args[0] as string;
    expect(texto).toBe('Protocolo enviado a la Secretaría.');
    expect(texto).not.toContain('CEISH-GEN-001');
    expect(navigateSpy).toHaveBeenCalledOnceWith(['/dashboard/investigador/mis-protocolos']);
    expect(page.isLoading).toBeFalse();
  });

  it('error con mensaje del backend → aviso con ese texto exacto, no navega y libera el botón', () => {
    finalizarSpy.and.returnValue(throwError(() => new Error(MENSAJE_ESTADO)));
    const page = paginaListaParaEnviar();

    page.onEnviarFinal();

    expect(snackSpy).toHaveBeenCalledTimes(1);
    expect(snackSpy.calls.mostRecent().args[0]).toBe(MENSAJE_ESTADO);
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(page.isLoading).toBeFalse();
  });

  it('error sin mensaje → aviso "No se pudo enviar el protocolo a la Secretaría."', () => {
    finalizarSpy.and.returnValue(throwError(() => new Error('')));
    const page = paginaListaParaEnviar();

    page.onEnviarFinal();

    expect(snackSpy.calls.mostRecent().args[0]).toBe(
      'No se pudo enviar el protocolo a la Secretaría.',
    );
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(page.isLoading).toBeFalse();
  });
});

describe('NuevoProtocoloPage — botón del paso 2 (D6)', () => {
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

  it('dice "Enviar a la Secretaría" y no "FIRMAR Y ENVIAR AL CEISH"', () => {
    const fixture = TestBed.createComponent(NuevoProtocoloPage);
    fixture.detectChanges();
    const boton = (fixture.nativeElement as HTMLElement).querySelector(
      'button.submit-btn',
    ) as HTMLButtonElement | null;

    expect(boton).not.toBeNull();
    expect(boton?.textContent).toContain('Enviar a la Secretaría');
    expect(boton?.textContent).not.toContain('FIRMAR Y ENVIAR AL CEISH');
  });
});

describe('NuevoProtocoloPage — dentro del marco (F09-8, C1)', () => {
  // Copias escritas a mano de specs/F09-investigador-borrador-envio/spec-ui.md §3.2 y D15 (v0.6).
  const MIS_PROTOCOLOS_HREF = '/dashboard/investigador/mis-protocolos';
  const TITULO = 'Nuevo protocolo';
  const SUBTITULO = 'Paso 1 de 3: Información básica';

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

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(NuevoProtocoloPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('no trae barra, marca ni pie propios', () => {
    const el = render();

    expect(el.querySelector('mat-toolbar')).toBeNull();
    expect(el.textContent).not.toContain('CEISH - ESPOCH');
    expect(el.textContent).not.toContain('Gestión de Investigaciones Éticas');
    expect(el.textContent).not.toContain('Todos los derechos reservados');
  });

  it('la miga lleva a Mis protocolos y marca "Nuevo protocolo" como página actual', () => {
    const el = render();
    const nav = el.querySelector('nav[aria-label="Ruta de navegación"]');
    expect(nav).not.toBeNull();

    const enlace = nav?.querySelector('a') as HTMLAnchorElement;
    expect(enlace.textContent?.trim()).toBe('Mis protocolos');
    expect(enlace.getAttribute('href')).toBe(MIS_PROTOCOLOS_HREF);

    const actual = nav?.querySelector('[aria-current="page"]');
    expect(actual?.textContent?.trim()).toBe(TITULO);
  });

  it('muestra el título y el subtítulo del paso 1 en PageHeader', () => {
    const el = render();
    const header = el.querySelector('app-page-header');
    expect(header).not.toBeNull();

    expect(header?.querySelector('h1')?.textContent?.trim()).toBe(TITULO);
    expect(header?.querySelector('p')?.textContent?.trim()).toBe(SUBTITULO);
    // D15: el h1 de 28 px se ajusta en :host, sin cambiar PageHeader en otras pantallas.
    expect(getComputedStyle(header?.querySelector('h1') as Element).fontSize).toBe('28px');
  });
});

describe('NuevoProtocoloPage — paso 1 Datos (F09-9, C2, C2b y C2c)', () => {
  // Copias escritas a mano de las filas C2, C2b, C2c y C2d de specs/F09-investigador-borrador-envio/tasks.md
  // y de D15 (v0.6; C2b reemplaza los textos de C2, C2c suma la tesis y C2d el nuevo diseño).
  const ETIQUETA_TITULO = 'Título de la investigación';
  const LEYENDA_TIPO = 'Tipo de estudio';
  const LEYENDA = 'Características del estudio';
  const CARACTERISTICAS: [string, string][] = [
    ['Involucra pueblos o nacionalidades indígenas', 'isIndigenousPopulation'],
    ['Utiliza muestras biológicas humanas', 'usesBiologicalSamples'],
    ['Involucra población vulnerable', 'isVulnerablePopulation'],
    ['Es un estudio multicéntrico', 'isMulticentric'],
    ['Participan instituciones externas', 'isExternal'],
  ];
  const DECLARACION =
    'Declaro bajo juramento (obligatorio) La investigación no ha iniciado su fase de campo y la información es veraz. Si el CEISH detecta que ya empezó, el protocolo se archiva con el motivo.';
  const DECLARACION_NEGRITA = 'Declaro bajo juramento';
  const DECLARACION_OBLIGATORIO = '(obligatorio)';
  const ERROR_DECLARACION = 'Debe aceptar la declaración jurada para continuar.';
  const BOTON = 'Guardar y continuar';
  const MOTIVO_TODO =
    '4 campos obligatorios pendientes: el título, el tipo de estudio, si es tesis y la declaración.';
  const MOTIVO_TESIS = '1 campo obligatorio pendiente: si es tesis.';
  const LEYENDA_TESIS = '¿Es un trabajo de titulación (tesis)?';
  const AVISO_TESIS =
    'Se piden 2 documentos más: la captura del informe antiplagio y el oficio o certificado del tutor.';
  const MOTIVO_TITULO_DECLARACION = '2 campos obligatorios pendientes: el título y la declaración.';
  const MOTIVO_DECLARACION = '1 campo obligatorio pendiente: la declaración.';
  const PASOS = ['1 · Datos', '2 · Documentos', '3 · Enviar a la Secretaría'];
  // Copias escritas a mano de D15 (textos resumidos del PET; la Secretaría debe validarlos).
  const EXPLICACIONES: Record<string, string> = {
    isIndigenousPopulation:
      'Pide el consentimiento informado en castellano y traducido a los idiomas ancestrales, y el consentimiento colectivo o comunitario firmado por el líder elegido por la asamblea comunitaria.',
    usesBiologicalSamples:
      'Material de origen humano como tejidos, fluidos, células, ADN, ARN o proteínas. Pide la declaratoria de confidencialidad y la declaración de conflicto de interés de todos los investigadores.',
    isVulnerablePopulation:
      'Por ejemplo: niños, niñas, adolescentes, embarazadas, adultos mayores, personas con discapacidad o trastornos mentales, grupos étnicos minoritarios o víctimas de conflicto armado. Pide la declaratoria de confidencialidad y la declaración de conflicto de interés.',
    isMulticentric:
      'Se realiza en más de un centro de investigación. La declaración de responsabilidad (Anexo 4) debe cubrir al investigador de cada centro.',
    isExternal:
      'Pide la carta de interés institucional (Anexo 5) firmada por la máxima autoridad de cada establecimiento, distrito o coordinación zonal.',
  };
  const ERROR_TIPOS = 'No se pudieron cargar los tipos de estudio.';
  const MENSAJE_400 = 'El título debe tener entre 20 y 200 caracteres';
  const MENSAJE_SIN_TEXTO = 'No se pudo registrar el protocolo.';
  // Tipos inventados para la prueba (las opciones salen de getStudyTypes, no de la plantilla).
  const TIPOS = [
    { id: 1, code: 'IO', name: 'Tipo de prueba uno' },
    { id: 2, code: 'EI', name: 'Tipo de prueba dos' },
  ];

  let guardarSpy: jasmine.Spy;
  let tiposSpy: jasmine.Spy;

  beforeEach(async () => {
    guardarSpy = jasmine.createSpy('guardarProtocoloInicial').and.returnValue(NEVER);
    tiposSpy = jasmine.createSpy('getStudyTypes').and.returnValue(of(TIPOS));

    await TestBed.configureTestingModule({
      imports: [NuevoProtocoloPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ProtocoloService,
          useValue: { guardarProtocoloInicial: guardarSpy, getStudyTypes: tiposSpy },
        },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30 }) } },
      ],
    }).compileComponents();
  });

  function render() {
    const fixture = TestBed.createComponent(NuevoProtocoloPage);
    const snackSpy = spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, page: fixture.componentInstance, el, snackSpy };
  }

  function llenarSinDeclaracion(page: NuevoProtocoloPage): void {
    page.generalForm.patchValue({
      titulo: 'Estudio de prueba del investigador',
      tipoEstudio: '2',
      esTesis: false,
    });
  }

  function boton(el: HTMLElement): HTMLButtonElement {
    return el.querySelector('button.next-btn') as HTMLButtonElement;
  }

  function fieldsetDe(el: HTMLElement, leyenda: string): HTMLFieldSetElement {
    const fieldset = Array.from(el.querySelectorAll('fieldset')).find(
      (f) => f.querySelector('legend')?.textContent?.trim() === leyenda,
    );
    expect(fieldset).withContext(`fieldset "${leyenda}"`).toBeDefined();
    return fieldset as HTMLFieldSetElement;
  }

  function radios(el: HTMLElement): HTMLInputElement[] {
    return Array.from(
      fieldsetDe(el, LEYENDA_TIPO).querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    );
  }

  function texto(nodo: Element | null | undefined): string | undefined {
    return nodo?.textContent?.replace(/\s+/g, ' ').trim();
  }

  /** Texto sin lo que lleva aria-hidden (como lo calcula un lector de pantalla). */
  function textoAccesible(nodo: Element | null | undefined): string | undefined {
    if (!nodo) return undefined;
    const copia = nodo.cloneNode(true) as Element;
    copia.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
    return texto(copia);
  }

  /** Color calculado de un token de F00 (los tokens son globales: styles.scss en las pruebas). */
  function colorDe(token: string): string {
    const sonda = document.createElement('div');
    sonda.style.backgroundColor = `var(${token})`;
    document.body.appendChild(sonda);
    const color = getComputedStyle(sonda).backgroundColor;
    sonda.remove();
    return color;
  }

  it('el título se nombra con su etiqueta de arriba', () => {
    const { el } = render();

    const textarea = el.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.id).toBeTruthy();
    expect(el.querySelector(`label[for="${textarea.id}"]`)?.textContent?.trim()).toBe(
      ETIQUETA_TITULO,
    );
  });

  it('sin desplegable ni errores debajo del título y del tipo (C2b)', () => {
    const { fixture, page, el } = render();
    page.generalForm.markAllAsTouched();
    fixture.detectChanges();

    expect(el.querySelector('mat-select')).toBeNull();
    expect(el.querySelector('[role="listbox"]')).toBeNull();
    expect(el.querySelector('[role="combobox"]')).toBeNull();
    expect(el.textContent).not.toContain('El título es obligatorio.');
    expect(el.textContent).not.toContain('El tipo de investigación es obligatorio.');
    // Sin texto debajo, el estado sigue accesible: título inválido y radios obligatorios.
    expect(el.querySelector('textarea')?.getAttribute('aria-invalid')).toBe('true');
    expect(radios(el).every((r) => r.required)).toBeTrue();
  });

  it('el tipo de estudio es un grupo de radios nativo con su legend, uno por tipo y sin línea de documentos', () => {
    const { el } = render();

    const grupo = radios(el);
    expect(grupo.length).toBe(TIPOS.length);
    expect(new Set(grupo.map((r) => r.name)).size).toBe(1);
    expect(grupo[0].name).toBeTruthy();
    expect(grupo.map((r) => texto(r.closest('label')))).toEqual(TIPOS.map((t) => t.name));
    expect(fieldsetDe(el, LEYENDA_TIPO).textContent).not.toContain('documentos');
  });

  it('elegir un tipo con el teclado marca su radio, fija el tipo y selecciona solo esa tarjeta', () => {
    const { fixture, page, el } = render();
    const [primero, segundo] = radios(el);

    // La barra espaciadora sobre el radio con foco produce el click; las flechas las maneja el
    // navegador entre radios nativos con el mismo name (no se simulan con dispatchEvent).
    segundo.focus();
    expect(document.activeElement).toBe(segundo);
    segundo.click();
    fixture.detectChanges();

    expect(segundo.checked).toBeTrue();
    expect(primero.checked).toBeFalse();
    expect(page.generalForm.controls.tipoEstudio.value).toBe('2');
    expect(segundo.closest('label')?.classList).toContain('tipo-card--selected');
    expect(primero.closest('label')?.classList).not.toContain('tipo-card--selected');
  });

  it('el contador dice "N/200" y, de 1 a 19 caracteres, "N/200 · faltan X" en ámbar', () => {
    const { fixture, page, el } = render();
    const contador = () => el.querySelector('#np-titulo-contador') as HTMLElement;
    const textarea = () => el.querySelector('textarea') as HTMLTextAreaElement;
    const casos: [string, string, boolean][] = [
      ['', '0/200', false],
      ['a'.repeat(10), '10/200 · faltan 10', true],
      ['a'.repeat(25), '25/200', false],
    ];

    for (const [valor, esperado, ambar] of casos) {
      page.generalForm.controls.titulo.setValue(valor);
      fixture.detectChanges();
      expect(contador().textContent?.trim()).withContext(valor).toBe(esperado);
      expect(contador().classList.contains('field-counter--corto')).withContext(valor).toBe(ambar);
      expect(textarea().classList.contains('field-textarea--corto')).withContext(valor).toBe(ambar);
    }
  });

  it('con el formulario vacío el aviso dice lo que falta y nombra al botón deshabilitado', () => {
    const { el } = render();

    const aviso = el.querySelector('#np-paso1-motivo');
    expect(boton(el).disabled).toBeTrue();
    expect(aviso?.textContent?.trim()).toBe(MOTIVO_TODO);
    expect(boton(el).getAttribute('aria-describedby')).toBe('np-paso1-motivo');
  });

  it('el aviso nombra solo lo que falta: dos pendientes y uno pendiente', () => {
    const { fixture, page, el } = render();
    const aviso = () => el.querySelector('#np-paso1-motivo')?.textContent?.trim();

    page.generalForm.patchValue({ tipoEstudio: '1', esTesis: true });
    fixture.detectChanges();
    expect(aviso()).toBe(MOTIVO_TITULO_DECLARACION);

    llenarSinDeclaracion(page);
    fixture.detectChanges();
    expect(aviso()).toBe(MOTIVO_DECLARACION);
    expect(boton(el).getAttribute('aria-describedby')).toBe('np-paso1-motivo');
  });

  it('con el formulario válido no hay aviso y el botón está habilitado', () => {
    const { fixture, page, el } = render();
    llenarSinDeclaracion(page);
    page.generalForm.patchValue({ isAffidavitAccepted: true });
    fixture.detectChanges();

    expect(el.querySelector('#np-paso1-motivo')).toBeNull();
    expect(boton(el).disabled).toBeFalse();
    expect(boton(el).hasAttribute('aria-describedby')).toBeFalse();
  });

  it('la declaración lleva "(obligatorio)" y su casilla se nombra con el texto completo (D15)', () => {
    const { el } = render();

    const casilla = el.querySelector('.legal-box input[type="checkbox"]') as HTMLInputElement;
    expect(casilla).not.toBeNull();
    const etiqueta = el.querySelector(`label[for="${casilla.id}"]`);
    expect(textoAccesible(etiqueta)).toBe(DECLARACION);
    expect(texto(etiqueta?.querySelector('strong'))).toBe(DECLARACION_NEGRITA);
    expect(texto(etiqueta?.querySelector('.legal-box__obligatorio'))).toBe(DECLARACION_OBLIGATORIO);
    const icono = etiqueta?.querySelector('mat-icon');
    expect(texto(icono)).toBe('warning');
    expect(icono?.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(casilla).width).toBe('20px');
  });

  it('las características van en un fieldset con su legend y cada casilla cambia su campo', () => {
    const { fixture, page, el } = render();

    const casillas = Array.from(
      fieldsetDe(el, LEYENDA).querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    expect(casillas.map((c) => texto(el.querySelector(`label[for="${c.id}"]`)))).toEqual(
      CARACTERISTICAS.map(([etiqueta]) => etiqueta),
    );

    casillas.forEach((casilla, i) => {
      const [etiqueta, campo] = CARACTERISTICAS[i];
      casilla.click();
      fixture.detectChanges();
      const valores = page.generalForm.getRawValue() as Record<string, unknown>;
      expect(valores[campo]).withContext(etiqueta).toBeTrue();
    });
  });

  it('no hay textos en mayúsculas ni los de C2 y el botón dice "Guardar y continuar"', () => {
    const { el } = render();

    expect(el.textContent).not.toContain('REGISTRAR Y CONTINUAR');
    expect(el.textContent).not.toContain('Registrar y continuar');
    expect(el.textContent).not.toContain('--- SELECCIONE ---');
    expect(el.textContent).not.toContain('DECLARO BAJO JURAMENTO');
    expect(el.textContent).not.toContain('Falta completar');
    expect(el.textContent).not.toContain('Guardar borrador y continuar');
    expect(texto(boton(el))).toContain(BOTON);
  });

  it('si fallan los tipos de estudio → aviso "No se pudieron cargar los tipos de estudio."', () => {
    tiposSpy.and.returnValue(throwError(() => new Error('fallo de catálogo')));
    const { snackSpy } = render();

    expect(snackSpy).toHaveBeenCalledOnceWith(ERROR_TIPOS, 'Cerrar');
  });

  it('400 del backend → aviso con su mensaje exacto, sin "❌"', () => {
    guardarSpy.and.returnValue(
      throwError(() => Object.assign(new Error(MENSAJE_400), { status: 400 })),
    );
    const { page, snackSpy } = render();
    llenarSinDeclaracion(page);
    page.generalForm.patchValue({ isAffidavitAccepted: true });

    page.guardarInicial();

    expect(snackSpy).toHaveBeenCalledOnceWith(MENSAJE_400, 'Cerrar', { duration: 10000 });
    expect(page.isLoading).toBeFalse();
  });

  it('error sin mensaje → aviso "No se pudo registrar el protocolo."', () => {
    guardarSpy.and.returnValue(throwError(() => new Error('')));
    const { page, snackSpy } = render();
    llenarSinDeclaracion(page);
    page.generalForm.patchValue({ isAffidavitAccepted: true });

    page.guardarInicial();

    expect(snackSpy.calls.mostRecent().args[0]).toBe(MENSAJE_SIN_TEXTO);
  });

  it('el error de la declaración se une a la casilla con aria-describedby', () => {
    const { fixture, page, el } = render();
    const input = () => el.querySelector('.legal-box input[type="checkbox"]') as HTMLInputElement;
    expect(input().getAttribute('aria-describedby') ?? '').not.toContain('np-declaracion-error');

    page.generalForm.controls.isAffidavitAccepted.markAsTouched();
    fixture.detectChanges();

    const error = el.querySelector('#np-declaracion-error');
    expect(error?.textContent?.trim()).toBe(ERROR_DECLARACION);
    expect(input().getAttribute('aria-describedby') ?? '').toContain('np-declaracion-error');
  });

  describe('tesis (D14, C2c)', () => {
    function radiosTesis(el: HTMLElement): HTMLInputElement[] {
      return Array.from(
        fieldsetDe(el, LEYENDA_TESIS).querySelectorAll<HTMLInputElement>('input[type="radio"]'),
      );
    }

    function elegir(fixture: { detectChanges(): void }, el: HTMLElement, etiqueta: string): void {
      const radio = radiosTesis(el).find((r) => texto(r.closest('label')) === etiqueta);
      expect(radio).withContext(`radio "${etiqueta}"`).toBeDefined();
      radio!.click();
      fixture.detectChanges();
    }

    it('es un grupo de radios nativo con su legend y las opciones "Sí" y "No", después del tipo de estudio', () => {
      const { el } = render();

      const grupo = radiosTesis(el);
      expect(grupo.map((r) => texto(r.closest('label')))).toEqual(['Sí', 'No']);
      expect(new Set(grupo.map((r) => r.name)).size).toBe(1);
      expect(grupo[0].name).toBeTruthy();
      expect(grupo.every((r) => r.required)).toBeTrue();
      const leyendas = Array.from(el.querySelectorAll('fieldset > legend')).map((l) => texto(l));
      expect(leyendas.indexOf(LEYENDA_TESIS)).toBe(leyendas.indexOf(LEYENDA_TIPO) + 1);
    });

    it('al empezar no hay respuesta: ningún radio marcado y el control en null', () => {
      const { page, el } = render();

      expect(radiosTesis(el).some((r) => r.checked)).toBeFalse();
      expect(page.generalForm.controls.esTesis.value).toBeNull();
      expect(page.generalForm.controls.esTesis.invalid).toBeTrue();
    });

    it('con "Sí" el aviso de 2 documentos entra en una región viva que ya existía y se une al fieldset; con "No" la región queda vacía', () => {
      const { fixture, el } = render();
      const fieldset = () => fieldsetDe(el, LEYENDA_TESIS);

      // La región viva está antes de elegir (si se insertara junto con el texto no se anunciaría).
      const region = fieldset().querySelector('[aria-live="polite"]');
      expect(region).withContext('región viva antes de elegir').not.toBeNull();
      expect(texto(region)).toBe('');
      expect(fieldset().hasAttribute('aria-describedby')).toBeFalse();

      elegir(fixture, el, 'Sí');
      const aviso = el.querySelector('#np-tesis-aviso');
      expect(texto(aviso)).toBe(AVISO_TESIS);
      expect(aviso?.closest('[aria-live="polite"]')).toBe(region);
      expect(fieldset().querySelector('[aria-live="polite"]')).toBe(region);
      expect(fieldset().getAttribute('aria-describedby')).toBe('np-tesis-aviso');

      elegir(fixture, el, 'No');
      expect(el.querySelector('#np-tesis-aviso')).toBeNull();
      expect(fieldset().querySelector('[aria-live="polite"]')).toBe(region);
      expect(texto(region)).toBe('');
      expect(el.textContent).not.toContain('Se piden 2 documentos más');
      expect(fieldset().hasAttribute('aria-describedby')).toBeFalse();
    });

    it('el aviso de pendientes dice "si es tesis" y, si es lo único pendiente, "1 campo obligatorio pendiente: si es tesis."', () => {
      const { fixture, page, el } = render();
      const aviso = () => el.querySelector('#np-paso1-motivo')?.textContent?.trim();
      expect(aviso()).toBe(MOTIVO_TODO);

      page.generalForm.patchValue({
        titulo: 'Estudio de prueba del investigador',
        tipoEstudio: '2',
        isAffidavitAccepted: true,
      });
      fixture.detectChanges();
      expect(aviso()).toBe(MOTIVO_TESIS);
    });

    it('sin responder la tesis el botón queda deshabilitado y no registra', () => {
      const { fixture, page, el } = render();
      page.generalForm.patchValue({
        titulo: 'Estudio de prueba del investigador',
        tipoEstudio: '2',
        isAffidavitAccepted: true,
      });
      fixture.detectChanges();

      expect(boton(el).disabled).toBeTrue();
      expect(boton(el).getAttribute('aria-describedby')).toBe('np-paso1-motivo');
      page.guardarInicial();
      expect(guardarSpy).not.toHaveBeenCalled();
    });

    for (const [etiqueta, esperado] of [
      ['Sí', true],
      ['No', false],
    ] as [string, boolean][]) {
      it(`con "${etiqueta}" POST /protocols envía isThesis: ${esperado}`, () => {
        const { fixture, page, el } = render();
        page.generalForm.patchValue({
          titulo: 'Estudio de prueba del investigador',
          tipoEstudio: '2',
          isAffidavitAccepted: true,
        });
        elegir(fixture, el, etiqueta);
        expect(boton(el).disabled).toBeFalse();

        boton(el).click();

        expect(guardarSpy).toHaveBeenCalledTimes(1);
        const body = guardarSpy.calls.mostRecent().args[0] as Record<string, unknown>;
        expect(body['isThesis']).toBe(esperado);
      });
    }

    it('elegir una opción la selecciona y deja la otra sin seleccionar', () => {
      const { fixture, page, el } = render();
      const [si, no] = radiosTesis(el);

      elegir(fixture, el, 'No');
      expect(no.checked).toBeTrue();
      expect(si.checked).toBeFalse();
      expect(page.generalForm.controls.esTesis.value).toBeFalse();
      expect(no.closest('label')?.classList).toContain('tesis-opcion--selected');
      expect(si.closest('label')?.classList).not.toContain('tesis-opcion--selected');

      elegir(fixture, el, 'Sí');
      expect(si.closest('label')?.classList).toContain('tesis-opcion--selected');
      expect(no.closest('label')?.classList).not.toContain('tesis-opcion--selected');
    });
  });
  describe('nuevo diseño (D15, C2d)', () => {
    function llenarTodo(page: NuevoProtocoloPage): void {
      llenarSinDeclaracion(page);
      page.generalForm.patchValue({ isAffidavitAccepted: true });
    }

    function pasos(el: HTMLElement): HTMLLIElement[] {
      return Array.from(el.querySelectorAll<HTMLLIElement>('ol[aria-label="Pasos"] > li'));
    }

    it('la barra de pasos tiene las 3 etiquetas y marca el paso abierto con aria-current', () => {
      const { fixture, page, el } = render();

      expect(pasos(el).map((li) => texto(li))).toEqual(PASOS);
      expect(pasos(el).map((li) => li.getAttribute('aria-current'))).toEqual(['step', null, null]);

      llenarTodo(page);
      fixture.detectChanges();
      page.stepper.next();
      fixture.detectChanges();

      expect(page.stepper.selectedIndex).toBe(1);
      expect(pasos(el).map((li) => li.getAttribute('aria-current'))).toEqual([null, 'step', null]);
      // La barra va fuera de la tarjeta, debajo de la cabecera.
      expect(el.querySelector('ol[aria-label="Pasos"]')?.closest('.datos-card')).toBeNull();
    });

    it('oculta la cabecera de mat-stepper y deja una sola tarjeta, sin mat-card', () => {
      const { el } = render();

      const cabecera = el.querySelector('.mat-horizontal-stepper-header-container');
      expect(cabecera).withContext('cabecera de mat-stepper en el DOM').not.toBeNull();
      expect(getComputedStyle(cabecera as Element).display).toBe('none');
      // El panel del paso se sigue nombrando por la etiqueta oculta: la misma de la barra.
      const panel = el.querySelector('[role="tabpanel"]');
      const nombrePanel = el.querySelector(`[id="${panel?.getAttribute('aria-labelledby')}"]`);
      expect(texto(nombrePanel)).toContain(PASOS[0]);
      expect(el.querySelector('mat-card')).toBeNull();
      expect(el.querySelectorAll('.datos-card').length).toBe(1);
      expect(el.querySelector('.datos-card')?.tagName).toBe('FORM');
    });

    it('el legend "Tipo de estudio" sigue en el DOM pero oculto a la vista', () => {
      const { el } = render();

      const legend = fieldsetDe(el, LEYENDA_TIPO).querySelector('legend') as HTMLElement;
      const estilo = getComputedStyle(legend);
      expect(estilo.display).not.toBe('none');
      expect(estilo.position).toBe('absolute');
      expect(legend.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    });

    it('cada tarjeta de tipo muestra su radio, sin ícono ni línea de documentos', () => {
      const { el } = render();

      for (const radio of radios(el)) {
        const tarjeta = radio.closest('label') as HTMLElement;
        expect(getComputedStyle(radio).display).not.toBe('none');
        expect(radio.getBoundingClientRect().width).toBeGreaterThan(1);
        expect(tarjeta.querySelector('mat-icon')).toBeNull();
        expect(tarjeta.textContent).not.toContain('documentos');
      }
    });

    it('Sí y No llevan el radio oculto a la vista pero accesible, y el elegido tiene fondo --c-primary', () => {
      const { fixture, el } = render();
      const grupo = Array.from(
        fieldsetDe(el, LEYENDA_TESIS).querySelectorAll<HTMLInputElement>('input[type="radio"]'),
      );
      expect(grupo.length).toBe(2);

      for (const radio of grupo) {
        expect(getComputedStyle(radio).display).not.toBe('none');
        expect(getComputedStyle(radio).visibility).not.toBe('hidden');
        expect(radio.getBoundingClientRect().width).toBeLessThanOrEqual(1);
        radio.focus();
        expect(document.activeElement).withContext('el radio recibe el foco').toBe(radio);
      }
      expect(grupo.map((r) => texto(r.labels?.[0]))).toEqual(['Sí', 'No']);

      const [si, no] = grupo;
      si.click();
      fixture.detectChanges();
      const primario = colorDe('--c-primary');
      expect(getComputedStyle(si.closest('label') as Element).backgroundColor).toBe(primario);
      expect(getComputedStyle(no.closest('label') as Element).backgroundColor).not.toBe(primario);
    });

    /** El botón ⓘ de una característica y su directiva MatTooltip. */
    function botonInfo(
      fixture: { debugElement: DebugElement },
      campo: string,
    ): { boton: HTMLButtonElement | null; tooltip: MatTooltip | undefined } {
      const fila = (fixture.debugElement.nativeElement as HTMLElement)
        .querySelector(`#np-car-${campo}`)
        ?.closest('.caracteristica');
      const boton = (fila?.querySelector('.caracteristica__info') as HTMLButtonElement) ?? null;
      const tooltip = fixture.debugElement
        .queryAll(By.directive(MatTooltip))
        .find((d) => d.nativeElement === boton)
        ?.injector.get(MatTooltip);
      return { boton, tooltip };
    }

    it('las características van en una columna; la explicación está oculta a la vista pero unida a su casilla', () => {
      const { el } = render();

      const grid = fieldsetDe(el, LEYENDA).querySelector('.caracteristicas__grid') as HTMLElement;
      expect(getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length).toBe(1);

      for (const [etiqueta, campo] of CARACTERISTICAS) {
        const casilla = el.querySelector(`input[type="checkbox"][id="np-car-${campo}"]`);
        expect(casilla).withContext(campo).not.toBeNull();
        expect(texto(el.querySelector(`label[for="np-car-${campo}"]`)))
          .withContext(campo)
          .toBe(etiqueta);
        const idExplicacion = casilla?.getAttribute('aria-describedby') ?? '';
        expect(idExplicacion).withContext(campo).toBeTruthy();
        const explicacion = el.querySelector(`[id="${idExplicacion}"]`) as HTMLElement;
        expect(texto(explicacion)).withContext(campo).toBe(EXPLICACIONES[campo]);
        // Oculta a la vista (visually-hidden), no con display: none: el lector la sigue leyendo.
        const estilo = getComputedStyle(explicacion);
        expect(estilo.display).withContext(campo).not.toBe('none');
        expect(estilo.position).withContext(campo).toBe('absolute');
        expect(explicacion.getBoundingClientRect().width).withContext(campo).toBeLessThanOrEqual(1);
        // A la vista solo queda el nombre: sin ":" ni explicación (el ⓘ lleva aria-hidden).
        const visible = casilla?.closest('.caracteristica')?.cloneNode(true) as Element;
        visible
          .querySelectorAll('.visually-hidden, [aria-hidden="true"]')
          .forEach((n) => n.remove());
        expect(texto(visible)).withContext(campo).toBe(etiqueta);
      }
    });

    it('cada característica tiene un botón ⓘ con su aria-label y la explicación literal en el tooltip', () => {
      const { fixture } = render();

      for (const [etiqueta, campo] of CARACTERISTICAS) {
        const { boton, tooltip } = botonInfo(fixture, campo);
        expect(boton?.tagName).withContext(campo).toBe('BUTTON');
        expect(boton?.type).withContext(campo).toBe('button');
        expect(boton?.closest('label')).withContext(`${campo}: fuera del label`).toBeNull();
        expect(boton?.getAttribute('aria-label'))
          .withContext(campo)
          .toBe(`Más información: ${etiqueta}`);
        const icono = boton?.querySelector('mat-icon');
        expect(texto(icono)).withContext(campo).toBe('info_outline');
        expect(icono?.getAttribute('aria-hidden')).withContext(campo).toBe('true');
        expect(tooltip).withContext(`${campo}: MatTooltip`).toBeDefined();
        expect(tooltip?.message).withContext(campo).toBe(EXPLICACIONES[campo]);
        expect(tooltip?.position).withContext(campo).toBe('above');
        boton?.focus();
        expect(document.activeElement).withContext(`${campo}: enfocable`).toBe(boton);
      }
    });

    /** Texto del tooltip abierto en el overlay, o undefined si no hay ninguno. */
    function tooltipAbierto(): string | undefined {
      return texto(document.querySelector('.np-tooltip'));
    }

    function pulsarEsc(): void {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
        } as KeyboardEventInit),
      );
    }

    it('con el mouse: pasar sobre el ⓘ lo abre, el clic no lo cierra ni cambia la casilla y Esc lo cierra', fakeAsync(() => {
      const { fixture, page, el } = render();
      const { boton, tooltip } = botonInfo(fixture, 'isMulticentric');

      boton?.dispatchEvent(new MouseEvent('mouseenter'));
      tick(0);
      fixture.detectChanges();
      expect(tooltipAbierto()).toBe(EXPLICACIONES['isMulticentric']);
      // WCAG 1.4.13: se puede pasar el mouse sobre el tooltip (el panel no es "non-interactive").
      expect(
        document.querySelector('.np-tooltip')?.closest('.mat-mdc-tooltip-panel-non-interactive'),
      ).toBeNull();

      boton?.dispatchEvent(new PointerEvent('click', { pointerType: 'mouse', bubbles: true }));
      tick(0);
      fixture.detectChanges();
      expect(tooltip?._isTooltipVisible()).withContext('sigue abierto tras el clic').toBeTrue();
      expect(page.generalForm.controls.isMulticentric.value).toBeFalse();
      expect((el.querySelector('#np-car-isMulticentric') as HTMLInputElement).checked).toBeFalse();

      pulsarEsc();
      tick(0);
      fixture.detectChanges();
      flush();
      expect(tooltip?._isTooltipVisible()).toBeFalse();
    }));

    it('con el teclado: enfocar el ⓘ lo abre y Enter (clic sin puntero) no lo cierra', fakeAsync(() => {
      const { fixture } = render();
      const { boton, tooltip } = botonInfo(fixture, 'isExternal');

      TestBed.inject(FocusMonitor).focusVia(boton as HTMLElement, 'keyboard');
      tick(0);
      fixture.detectChanges();
      expect(tooltipAbierto()).toBe(EXPLICACIONES['isExternal']);

      boton?.dispatchEvent(new PointerEvent('click', { pointerType: '', bubbles: true }));
      tick(0);
      fixture.detectChanges();
      expect(tooltip?._isTooltipVisible()).withContext('sigue abierto tras Enter').toBeTrue();
      flush();
    }));

    it('con un toque: el clic lo abre y otro lo cierra, sin cambiar la casilla', fakeAsync(() => {
      const { fixture, page } = render();
      const { boton, tooltip } = botonInfo(fixture, 'usesBiologicalSamples');
      const tocar = () => {
        boton?.dispatchEvent(new PointerEvent('click', { pointerType: 'touch', bubbles: true }));
        tick(0);
        fixture.detectChanges();
      };

      tocar();
      expect(tooltipAbierto()).toBe(EXPLICACIONES['usesBiologicalSamples']);
      expect(page.generalForm.controls.usesBiologicalSamples.value).toBeFalse();

      tocar();
      flush();
      expect(tooltip?._isTooltipVisible()).toBeFalse();
      expect(page.generalForm.controls.usesBiologicalSamples.value).toBeFalse();
    }));

    it('si a una característica le falta el texto no hay botón ⓘ ni texto oculto', () => {
      const { fixture, page, el } = render();
      page.caracteristicas = page.caracteristicas.map((c) =>
        c.campo === 'isExternal' ? { ...c, descripcion: undefined } : c,
      );
      fixture.detectChanges();

      const casilla = el.querySelector('#np-car-isExternal') as HTMLInputElement;
      const fila = casilla.closest('.caracteristica') as HTMLElement;
      expect(casilla.hasAttribute('aria-describedby')).toBeFalse();
      expect(fila.querySelector('button')).toBeNull();
      expect(fila.querySelector('mat-icon')).toBeNull();
      expect(el.querySelector('#np-car-isExternal-desc')).toBeNull();
      expect(texto(fila)).toBe('Participan instituciones externas');
    });

    it('el aviso dice "N campos obligatorios pendientes: …" en plural y "1 campo …" en singular', () => {
      const { fixture, page, el } = render();
      const aviso = () => el.querySelector('#np-paso1-motivo');

      expect(texto(aviso())).toBe(MOTIVO_TODO);
      const icono = aviso()?.parentElement?.querySelector('mat-icon');
      expect(texto(icono)).toBe('info_outline');
      expect(icono?.getAttribute('aria-hidden')).toBe('true');
      expect(boton(el).getAttribute('aria-describedby')).toBe('np-paso1-motivo');

      llenarSinDeclaracion(page);
      fixture.detectChanges();
      expect(texto(aviso())).toBe(MOTIVO_DECLARACION);

      page.generalForm.patchValue({ isAffidavitAccepted: true });
      fixture.detectChanges();
      expect(aviso()).toBeNull();
      expect(el.querySelector('.step-actions__reason')).toBeNull();
    });

    it('el botón dice "Guardar y continuar", sin flecha', () => {
      const { el } = render();

      expect(texto(boton(el))).toBe(BOTON);
      expect(boton(el).querySelector('mat-icon')).toBeNull();
    });
  });
});

describe('NuevoProtocoloPage - continuar borrador', () => {
  const mensajeNoDisponible =
    'No se puede continuar: este protocolo ya no es un borrador o no está disponible.';
  // queryParamMap observable (C2): la página escucha los cambios de query params; snapshot sigue
  // al último valor emitido.
  let queryParams$: BehaviorSubject<ParamMap>;
  let misProtocolosSpy: jasmine.Spy;
  let getChecklistSpy: jasmine.Spy;
  let guardarSpy: jasmine.Spy;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    misProtocolosSpy = jasmine.createSpy('misProtocolos').and.returnValue(of([]));
    getChecklistSpy = jasmine.createSpy('getChecklist').and.returnValue(
      of([
        {
          id: 1,
          requirementCode: 'DOCUMENTO_TEST',
          requirementName: 'Documento de prueba del protocolo',
          status: 'NO_PRESENTADO',
        },
      ]),
    );
    guardarSpy = jasmine.createSpy('guardarProtocoloInicial').and.returnValue(NEVER);

    await TestBed.configureTestingModule({
      imports: [NuevoProtocoloPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParams$.asObservable(),
            get snapshot() {
              return { queryParamMap: queryParams$.value };
            },
          },
        },
        {
          provide: ProtocoloService,
          useValue: {
            misProtocolos: misProtocolosSpy,
            getChecklist: getChecklistSpy,
            guardarProtocoloInicial: guardarSpy,
            getStudyTypes: () => of([]),
          },
        },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30 }) } },
      ],
    }).compileComponents();

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  function render(
    borrador: string | null,
    respuesta?: Observable<ProtocoloResumen[]>,
  ) {
    queryParams$.next(convertToParamMap(borrador === null ? {} : { borrador }));
    if (respuesta) misProtocolosSpy.and.returnValue(respuesta);
    const fixture = TestBed.createComponent(NuevoProtocoloPage);
    const snackSpy = spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open');
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, snackSpy };
  }

  function protocolo(id: number, estado: EstadoProtocolo): ProtocoloResumen {
    return {
      id,
      codigoCeish: 'CEISH-TEST-' + id,
      titulo: 'Estudio de prueba del investigador',
      estado,
      fechaCreacion: '2026-01-01',
    };
  }

  async function expectRechazado(
    borrador: string,
    respuesta: Observable<ProtocoloResumen[]>,
  ): Promise<void> {
    const { fixture, page, snackSpy } = render(borrador, respuesta);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(page.stepper.selectedIndex).toBe(0);
    expect(getChecklistSpy).not.toHaveBeenCalled();
    expect(snackSpy).toHaveBeenCalledWith(mensajeNoDisponible, 'Cerrar', {
      duration: 5000,
    });
    expect(navigateSpy).toHaveBeenCalledOnceWith([
      '/dashboard/investigador/mis-protocolos',
    ]);
  }

  it('?borrador=5 y estado BORRADOR carga checklist sin crear otro protocolo y abre el paso 2', async () => {
    const { fixture, page } = render(
      '5',
      of([protocolo(5, EstadoProtocolo.BORRADOR)]),
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(guardarSpy).not.toHaveBeenCalled();
    expect(getChecklistSpy).toHaveBeenCalledOnceWith(5);
    expect(page.protocolId).toBe(5);
    expect(page.stepper.selectedIndex).toBe(1);
    expect(page.stepper.steps.first.completed).toBeTrue();
    expect(page.stepper.steps.first.editable).toBeFalse();
  });

  it('el subtítulo dice "Paso 1 de 3" en el paso 1 y "Paso 2 de 3" en el paso 2 (D15)', async () => {
    // Copias escritas a mano de D15 en specs/F09-investigador-borrador-envio/spec-ui.md (v0.6).
    const subtituloDatos = 'Paso 1 de 3: Información básica';
    const subtituloDocumentos = 'Paso 2 de 3: Documentos';
    const subtitulo = (fixture: { nativeElement: unknown }) =>
      (fixture.nativeElement as HTMLElement)
        .querySelector('app-page-header p')
        ?.textContent?.trim();

    const { fixture, page } = render('5', of([protocolo(5, EstadoProtocolo.BORRADOR)]));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.stepper.selectedIndex).toBe(1);
    expect(subtitulo(fixture)).toBe(subtituloDocumentos);

    queryParams$.next(convertToParamMap({}));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.stepper.selectedIndex).toBe(0);
    expect(subtitulo(fixture)).toBe(subtituloDatos);
  });

  it('?borrador=5 confirmado: la página actual de la miga dice "Borrador" (F09-8)', async () => {
    const { fixture } = render('5', of([protocolo(5, EstadoProtocolo.BORRADOR)]));
    await fixture.whenStable();
    fixture.detectChanges();

    const actual = (fixture.nativeElement as HTMLElement).querySelector(
      'nav[aria-label="Ruta de navegación"] [aria-current="page"]',
    );
    expect(actual?.textContent?.trim()).toBe('Borrador');
  });

  function migaActual(fixture: { nativeElement: unknown }): string | undefined {
    return (fixture.nativeElement as HTMLElement)
      .querySelector('nav[aria-label="Ruta de navegación"] [aria-current="page"]')
      ?.textContent?.trim();
  }

  function expectProtocoloNuevo(page: NuevoProtocoloPage, fixture: { nativeElement: unknown }) {
    expect(page.stepper.selectedIndex).toBe(0);
    expect(page.stepper.steps.first.editable).toBeTrue();
    expect(page.generalForm.getRawValue()).toEqual({
      titulo: '',
      tipoEstudio: '',
      esTesis: null,
      isAffidavitAccepted: false,
      usesBiologicalSamples: false,
      isVulnerablePopulation: false,
      isIndigenousPopulation: false,
      isMulticentric: false,
      isExternal: false,
    });
    expect(page.protocolId).toBeNull();
    expect(page.isDraftContinuation).toBeFalse();
    expect(page.documentosRequeridos).toEqual([]);
    expect(migaActual(fixture)).toBe('Nuevo protocolo');
  }

  it('de ?borrador=5 a la ruta sin parámetro vuelve a un protocolo nuevo (C2)', async () => {
    const { fixture, page } = render('5', of([protocolo(5, EstadoProtocolo.BORRADOR)]));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.stepper.selectedIndex).toBe(1);

    queryParams$.next(convertToParamMap({}));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expectProtocoloNuevo(page, fixture);
    expect(getChecklistSpy).toHaveBeenCalledTimes(1);
  });

  it('una respuesta tardía de la comprobación después de quitar ?borrador no abre el paso 2', async () => {
    const respuesta = new Subject<ProtocoloResumen[]>();
    const { fixture, page } = render('5', respuesta);

    queryParams$.next(convertToParamMap({}));
    respuesta.next([protocolo(5, EstadoProtocolo.BORRADOR)]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getChecklistSpy).not.toHaveBeenCalled();
    expectProtocoloNuevo(page, fixture);
  });

  it('al crear el protocolo la URL pasa a ?borrador={id} y "Nuevo protocolo" lo limpia (C2)', async () => {
    guardarSpy.and.returnValue(of({ id: 7 }));
    const { fixture, page } = render(null);
    page.generalForm.patchValue({
      titulo: 'Estudio de prueba del investigador',
      tipoEstudio: '2',
      esTesis: false,
      isAffidavitAccepted: true,
    });
    fixture.detectChanges();

    page.guardarInicial();
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledOnceWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { borrador: 7 },
      replaceUrl: true,
    });
    expect(page.protocolId).toBe(7);
    expect(page.stepper.selectedIndex).toBe(1);

    // La URL fijada no vuelve a pedir el checklist ni comprueba el borrador.
    queryParams$.next(convertToParamMap({ borrador: '7' }));
    fixture.detectChanges();
    expect(getChecklistSpy).toHaveBeenCalledTimes(1);
    expect(misProtocolosSpy).not.toHaveBeenCalled();
    expect(page.stepper.selectedIndex).toBe(1);

    queryParams$.next(convertToParamMap({}));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expectProtocoloNuevo(page, fixture);

    // Después de limpiar, el paso 1 vuelve a registrar un protocolo y avanza al paso 2.
    guardarSpy.and.returnValue(of({ id: 8 }));
    page.generalForm.patchValue({
      titulo: 'Segundo estudio de prueba del investigador',
      tipoEstudio: '2',
      esTesis: false,
      isAffidavitAccepted: true,
    });
    fixture.detectChanges();
    page.guardarInicial();
    fixture.detectChanges();

    expect(guardarSpy).toHaveBeenCalledTimes(2);
    expect(page.protocolId).toBe(8);
    expect(page.stepper.selectedIndex).toBe(1);
  });

  it('después de crear el protocolo el paso 1 queda bloqueado y no registra otro (C2)', async () => {
    guardarSpy.and.returnValue(of({ id: 7 }));
    const { fixture, page } = render(null);
    page.generalForm.patchValue({
      titulo: 'Estudio de prueba del investigador',
      tipoEstudio: '2',
      esTesis: false,
      isAffidavitAccepted: true,
    });
    fixture.detectChanges();
    page.guardarInicial();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.stepper.selectedIndex).toBe(1);

    expect(page.stepper.steps.first.editable).toBeFalse();
    page.stepper.previous();
    fixture.detectChanges();
    expect(page.stepper.selectedIndex).toBe(1);

    page.guardarInicial();
    fixture.detectChanges();
    expect(guardarSpy).toHaveBeenCalledTimes(1);
  });

  it('?borrador=5 rechaza EN_REVISION_SECRETARIA y regresa a Mis protocolos', async () => {
    await expectRechazado(
      '5',
      of([protocolo(5, EstadoProtocolo.EN_REVISION_SECRETARIA)]),
    );
  });

  it('?borrador=5 sin coincidencia en Mis protocolos rechaza la continuacion', async () => {
    await expectRechazado('5', of([protocolo(6, EstadoProtocolo.BORRADOR)]));
  });

  it('?borrador=5 cuando falla Mis protocolos rechaza la continuacion', async () => {
    await expectRechazado('5', throwError(() => new Error('fallo de consulta')));
  });

  it('mientras comprueba ?borrador=5 el boton de guardar del paso 1 queda deshabilitado', () => {
    const { fixture, page } = render('5', NEVER);
    page.generalForm.patchValue({
      titulo: 'Estudio de prueba del investigador',
      tipoEstudio: 'OBSERVACIONAL',
      esTesis: false,
      isAffidavitAccepted: true,
    });
    fixture.detectChanges();

    const guardar = (fixture.nativeElement as HTMLElement).querySelector(
      'button.next-btn',
    ) as HTMLButtonElement;
    expect(page.generalForm.valid).toBeTrue();
    expect(guardar.disabled).toBeTrue();
    expect(guardarSpy).not.toHaveBeenCalled();
  });

  for (const borrador of [null, 'abc', '0', '-1', '1.5']) {
    it(`?borrador=${borrador} conserva el flujo normal sin abrir el paso 2`, async () => {
      const { fixture, page } = render(borrador);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(misProtocolosSpy).not.toHaveBeenCalled();
      expect(getChecklistSpy).not.toHaveBeenCalled();
      expect(guardarSpy).not.toHaveBeenCalled();
      expect(page.stepper.selectedIndex).toBe(0);
      expect(page.stepper.steps.first.editable).toBeTrue();
    });
  }

  it('el formulario vacio mantiene bloqueado el avance lineal en el flujo normal', () => {
    const { page } = render(null);

    page.stepper.next();

    expect(page.stepper.selectedIndex).toBe(0);
    expect(page.generalForm.invalid).toBeTrue();
  });

  it('con el formulario valido el flujo normal avanza y marca el paso 1 como completado', () => {
    const { fixture, page } = render(null);
    page.generalForm.patchValue({
      titulo: 'Estudio de prueba del investigador',
      tipoEstudio: 'OBSERVACIONAL',
      esTesis: false,
      isAffidavitAccepted: true,
    });
    fixture.detectChanges();

    page.stepper.next();
    fixture.detectChanges();

    expect(page.generalForm.valid).toBeTrue();
    expect(page.stepper.selectedIndex).toBe(1);
    expect(page.stepper.steps.first.completed).toBeTrue();
  });
});
