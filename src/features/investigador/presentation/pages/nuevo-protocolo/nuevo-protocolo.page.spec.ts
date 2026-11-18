import { DebugElement } from '@angular/core';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { FocusMonitor } from '@angular/cdk/a11y';
import { BehaviorSubject, defer, EMPTY, NEVER, Observable, of, Subject, throwError } from 'rxjs';

import { NuevoProtocoloPage } from './nuevo-protocolo.page';
import { ProtocoloService } from '../../../application/services/protocolo.service';
import { AuthFacade } from '@features/auth/facades/auth.facade';
import { IDocumentRepositoryPort } from '@domain/ports/IDocumentRepositoryPort';
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
        { provide: IDocumentRepositoryPort, useValue: {} },
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
        { provide: IDocumentRepositoryPort, useValue: {} },
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

  it('C6 (D30): no envía principalInvestigatorId; el backend lo toma del token (RF-02.9)', () => {
    const body = enviarFormularioValido();
    expect(Object.prototype.hasOwnProperty.call(body, 'principalInvestigatorId')).toBeFalse();
  });

  it('C6 (D30): el resto del cuerpo, isThesis incluido, sigue con las mismas claves', () => {
    const body = enviarFormularioValido();
    expect(Object.keys(body).sort()).toEqual(
      [
        'title',
        'studyTypeId',
        'geographicCoverage',
        'studyDurationMonths',
        'usesBiologicalSamples',
        'isVulnerablePopulation',
        'isIndigenousPopulation',
        'isMulticentric',
        'hasExternalInstitutions',
        'isThesis',
        'sponsorRuc',
        'sponsorPhone',
        'sponsorAddress',
        'sponsorWeb',
        'sponsorExecutingAgency',
        'financingAmount',
        'isAffidavitAccepted',
        'investigators',
        'institutions',
      ].sort(),
    );
    expect(body['isThesis']).toBeFalse();
  });

  it('envía los campos obligatorios del DTO con sus tipos', () => {
    const body = enviarFormularioValido();
    expect(body['title']).toBe('ZZ_TEST_ Protocolo de prueba sin nivel de riesgo');
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
        { provide: IDocumentRepositoryPort, useValue: {} },
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
    // Lista real con todo presentado (D16): ya no hay envío con cualquier archivo.
    page.estadoChecklist = 'listo';
    page.documentosRequeridos = [
      {
        id: 1,
        nombre: 'Documento de prueba presentado',
        status: 'PRESENTADO',
        observaciones: '',
        codigoFormato: null,
      },
    ];
    return page;
  }

  // Desde C4 (D17) el aviso va en la tarjeta del paso 3, sin snackbar ni navegación automática.
  it('201 → queda enviado, sin snackbar ni navegación (D3, D17)', () => {
    finalizarSpy.and.returnValue(of({}));
    const page = paginaListaParaEnviar();

    page.onEnviarFinal();

    expect(finalizarSpy).toHaveBeenCalledOnceWith(7);
    expect(page.enviado).toBeTrue();
    expect(page.enviando).toBeFalse();
    expect(page.errorEnvio).toBeNull();
    expect(snackSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('error con mensaje del backend → errorEnvio con ese texto exacto, no navega y libera el botón', () => {
    finalizarSpy.and.returnValue(throwError(() => new Error(MENSAJE_ESTADO)));
    const page = paginaListaParaEnviar();

    page.onEnviarFinal();

    expect(page.errorEnvio).toBe(MENSAJE_ESTADO);
    expect(snackSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(page.enviando).toBeFalse();
    expect(page.enviado).toBeFalse();
  });

  it('error sin mensaje → "No se pudo enviar el protocolo a la Secretaría."', () => {
    finalizarSpy.and.returnValue(throwError(() => new Error('')));
    const page = paginaListaParaEnviar();

    page.onEnviarFinal();

    expect(page.errorEnvio).toBe('No se pudo enviar el protocolo a la Secretaría.');
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(page.enviando).toBeFalse();
  });
});

describe('NuevoProtocoloPage — botón de envío (D6; en el paso 3 desde D17)', () => {
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
        { provide: IDocumentRepositoryPort, useValue: {} },
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
        { provide: IDocumentRepositoryPort, useValue: {} },
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
        { provide: IDocumentRepositoryPort, useValue: {} },
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

      // Desde C4 (D19) cada paso suma su estado en texto oculto.
      expect(pasos(el).map((li) => texto(li))).toEqual([
        `${PASOS[0]}, paso actual`,
        `${PASOS[1]}, pendiente`,
        `${PASOS[2]}, pendiente`,
      ]);
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
    misProtocolosSpy = jasmine.createSpy('obtenerMisProtocolos').and.returnValue(of([]));
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
            obtenerMisProtocolos: misProtocolosSpy,
            obtenerChecklist: getChecklistSpy,
            guardarProtocoloInicial: guardarSpy,
            getStudyTypes: () => of([]),
          },
        },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30 }) } },
        { provide: IDocumentRepositoryPort, useValue: {} },
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

  it('?borrador=5 cuando Mis protocolos falla sin status rechaza la continuacion (D8)', async () => {
    await expectRechazado('5', throwError(() => new Error('fallo de consulta')));
  });

  it('(C4-8) D18: un 404 al comprobar ?borrador=5 sigue D8 y vuelve a Mis protocolos', async () => {
    await expectRechazado(
      '5',
      throwError(() => Object.assign(new Error('Not Found'), { status: 404 })),
    );
  });

  for (const status of [0, 500]) {
    it(`(C4-9) D18: estado ${status} muestra ErrorState sin navegar y Reintentar sigue hasta el checklist`, async () => {
      // Copia escrita a mano de D18 en specs/F09-investigador-borrador-envio/spec-ui.md (v0.8).
      const textoError = 'No se pudo cargar el borrador. Revise su conexión e intente de nuevo.';
      const { fixture, page } = render(
        '5',
        throwError(() => Object.assign(new Error('fallo'), { status })),
      );
      await fixture.whenStable();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(navigateSpy).not.toHaveBeenCalled();
      expect(getChecklistSpy).not.toHaveBeenCalled();
      expect(
        el.querySelector('app-error-state .state__message')?.textContent?.trim(),
      ).toBe(textoError);
      expect(el.querySelector('ol[aria-label="Pasos"]')).toBeNull();
      expect(el.querySelector('mat-stepper')).toBeNull();
      expect(el.querySelector('.datos-card')).toBeNull();

      misProtocolosSpy.and.returnValue(of([protocolo(5, EstadoProtocolo.BORRADOR)]));
      const reintentar = el.querySelector('app-error-state button') as HTMLButtonElement;
      expect(reintentar.textContent?.trim()).toBe('Reintentar');
      reintentar.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(misProtocolosSpy).toHaveBeenCalledTimes(2);
      expect(el.querySelector('app-error-state')).toBeNull();
      expect(el.querySelector('ol[aria-label="Pasos"]')).not.toBeNull();
      expect(getChecklistSpy).toHaveBeenCalledOnceWith(5);
      expect(page.stepper.selectedIndex).toBe(1);
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  }

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

describe('NuevoProtocoloPage — paso 2 Documentos (F09-10, F09-11, F09-12; D16, C3)', () => {
  // Copias escritas a mano de D16 en specs/F09-investigador-borrador-envio/spec-ui.md (v0.7).
  const TEXTO_CARGANDO = 'Cargando los documentos requeridos…';
  const TEXTO_ERROR = 'No pudimos cargar la lista de documentos.';
  const TEXTO_VACIO = 'No encontramos documentos requeridos para este protocolo.';
  const TODOS_PRESENTADOS = 'Todos los documentos están presentados.';
  const MENSAJE_PDF = 'El archivo debe tener formato PDF';
  const NOMBRES_INVENTADOS = [
    'Protocolo de Investigación (Requerido)',
    'Formulario de Consentimiento Informado',
    'Hojas de Vida del Equipo',
    'Carta de Compromiso Ético',
  ];

  let queryParams$: BehaviorSubject<ParamMap>;
  let obtenerChecklistSpy: jasmine.Spy;
  let subirSpy: jasmine.Spy;
  let subirBulkSpy: jasmine.Spy;
  let finalizarSpy: jasmine.Spy;
  let downloadTemplateSpy: jasmine.Spy;

  /** Requisito con la forma del backend (entidad sin mapear, protocol-requirement.entity.orm.ts). */
  function requisito(id: number, nombre: string, status: string, observations?: string) {
    return {
      id,
      requirementCode: `ZZ_TEST_CODIGO_${id}`,
      requirementName: nombre,
      status,
      pageCount: 0,
      protocolId: 5,
      observations,
    };
  }

  const CHECKLIST_2_DE_3 = [
    requisito(11, 'Documento de prueba uno', 'PRESENTADO'),
    requisito(12, 'Documento de prueba dos', 'NO_PRESENTADO', 'Falta la firma del tutor'),
    requisito(13, 'Documento de prueba tres', 'PRESENTADO'),
  ];

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<ParamMap>(convertToParamMap({ borrador: '5' }));
    obtenerChecklistSpy = jasmine.createSpy('obtenerChecklist').and.returnValue(of([]));
    subirSpy = jasmine.createSpy('subirDocumento').and.returnValue(NEVER);
    subirBulkSpy = jasmine.createSpy('subirDocumentosBulk').and.returnValue(of([]));
    finalizarSpy = jasmine.createSpy('finalizarProtocolo').and.returnValue(NEVER);
    downloadTemplateSpy = jasmine.createSpy('downloadTemplate').and.returnValue(NEVER);

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
            obtenerMisProtocolos: () =>
              of([
                {
                  id: 5,
                  codigoCeish: 'CEISH-TEST-5',
                  titulo: 'Estudio de prueba del investigador',
                  estado: EstadoProtocolo.BORRADOR,
                  fechaCreacion: '2026-01-01',
                },
              ]),
            obtenerChecklist: obtenerChecklistSpy,
            getChecklist: () => of([requisito(9001, NOMBRES_INVENTADOS[0], 'NO_PRESENTADO')]),
            subirDocumento: subirSpy,
            subirDocumentosBulk: subirBulkSpy,
            finalizarProtocolo: finalizarSpy,
            guardarProtocoloInicial: () => NEVER,
            getStudyTypes: () => of([]),
          },
        },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: 30 }) } },
        { provide: IDocumentRepositoryPort, useValue: { downloadTemplate: downloadTemplateSpy } },
      ],
    }).compileComponents();
  });

  async function abrir(checklist: Observable<unknown[]>) {
    obtenerChecklistSpy.and.returnValue(checklist);
    const fixture = TestBed.createComponent(NuevoProtocoloPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, page: fixture.componentInstance, el };
  }

  const texto = (nodo: Element | null | undefined) =>
    (nodo?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const filas = (el: HTMLElement) => Array.from(el.querySelectorAll('.docs-lista > li'));
  // Desde C4 (D17) el botón de debajo de la tarjeta del paso 2 es "Siguiente paso".
  const botonEnviar = (el: HTMLElement) =>
    el.querySelector('button.siguiente-btn') as HTMLButtonElement;
  const fila = (el: HTMLElement, nombre: string) =>
    filas(el).find((li) => texto(li.querySelector('.doc__nombre')) === nombre) as HTMLElement;

  it('(1) si el checklist falla: ErrorState con Reintentar, que lo vuelve a pedir, y envío deshabilitado', async () => {
    const { fixture, page, el } = await abrir(throwError(() => new Error('Error 500')));

    expect(page.stepper.selectedIndex).toBe(1);
    expect(texto(el.querySelector('app-error-state .state__message'))).toBe(TEXTO_ERROR);
    expect(filas(el).length).toBe(0);
    expect(botonEnviar(el).disabled).toBeTrue();

    obtenerChecklistSpy.and.returnValue(of(CHECKLIST_2_DE_3));
    const reintentar = el.querySelector('app-error-state button') as HTMLButtonElement;
    expect(texto(reintentar)).toBe('Reintentar');
    reintentar.click();
    fixture.detectChanges();

    expect(obtenerChecklistSpy).toHaveBeenCalledTimes(2);
    expect(obtenerChecklistSpy.calls.mostRecent().args).toEqual([5]);
    expect(el.querySelector('app-error-state')).toBeNull();
    expect(filas(el).length).toBe(3);
  });

  it('(2) vacío: EmptyState y envío deshabilitado', async () => {
    const { el } = await abrir(of([]));

    expect(texto(el.querySelector('app-empty-state .state__message'))).toBe(TEXTO_VACIO);
    expect(filas(el).length).toBe(0);
    expect(botonEnviar(el).disabled).toBeTrue();
    expect(el.querySelector('#np-envio-motivo')).toBeNull();
  });

  it('(3) cargando: LoadingState y envío deshabilitado', async () => {
    const { el } = await abrir(NEVER);

    expect(texto(el.querySelector('app-loading-state .state__message'))).toBe(TEXTO_CARGANDO);
    expect(botonEnviar(el).disabled).toBeTrue();
  });

  it('(4) sin requisitos inventados, "Modo de emergencia" ni "Modo Contingencia", con error o vacío', async () => {
    for (const respuesta of [of([]), throwError(() => new Error('Error 500'))]) {
      const { page, el } = await abrir(respuesta);
      const todo = texto(el);

      expect(page.documentosRequeridos).toEqual([]);
      expect(todo).not.toContain('Modo de emergencia');
      expect(todo).not.toContain('Modo Contingencia');
      expect(todo).not.toContain('SELECCIONAR ARCHIVOS');
      for (const nombre of NOMBRES_INVENTADOS) expect(todo).not.toContain(nombre);
      for (const id of ['9001', '9002', '9003', '9004']) expect(todo).not.toContain(id);
    }
  });

  it('(5) una fila por requisito con su nombre literal y sin código interno', async () => {
    const { el } = await abrir(of(CHECKLIST_2_DE_3));

    expect(filas(el).map((li) => texto(li.querySelector('.doc__nombre')))).toEqual([
      'Documento de prueba uno',
      'Documento de prueba dos',
      'Documento de prueba tres',
    ]);
    expect(texto(el)).not.toContain('ZZ_TEST_CODIGO');
    expect(
      filas(el).every(
        (li) => li.querySelector('mat-icon.doc__icono')?.getAttribute('aria-hidden') === 'true',
      ),
    ).toBeTrue();
    expect(texto(fila(el, 'Documento de prueba dos').querySelector('.doc__observaciones'))).toBe(
      'Con observaciones: Falta la firma del tutor',
    );
    expect(fila(el, 'Documento de prueba uno').querySelector('.doc__observaciones')).toBeNull();
  });

  it('(6) "Presentado" solo en los presentados; los demás dicen "Subir"', async () => {
    const { el } = await abrir(of(CHECKLIST_2_DE_3));

    const presentado = (nombre: string) =>
      texto(fila(el, nombre).querySelector('.doc__estado--presentado')) || null;
    expect(presentado('Documento de prueba uno')).toBe('check_circlePresentado');
    expect(presentado('Documento de prueba dos')).toBeNull();
    expect(presentado('Documento de prueba tres')).toBe('check_circlePresentado');
    expect(texto(fila(el, 'Documento de prueba dos').querySelector('.doc__boton'))).toBe(
      'uploadSubir',
    );
    expect(texto(el)).not.toMatch(/SUBIR|PRESENTADO|REINTENTAR|CARGANDO/);
  });

  it('(7) con templateCode el orden es Subir → Descargar formato; (8) sin templateCode no hay botón (D28)', async () => {
    const { el: sinCodigo } = await abrir(of(CHECKLIST_2_DE_3));
    expect(sinCodigo.querySelector('.doc__formato')).toBeNull();
    expect(texto(sinCodigo)).not.toContain('Descargar formato');
  });

  it('(9) aria-label "Subir {nombre}" / "Cambiar {nombre}" y el ícono con aria-hidden', async () => {
    const { el } = await abrir(of(CHECKLIST_2_DE_3));

    const etiqueta = (nombre: string) =>
      fila(el, nombre).querySelector('.doc__boton')?.getAttribute('aria-label');
    expect(etiqueta('Documento de prueba uno')).toBe('Cambiar Documento de prueba uno');
    expect(etiqueta('Documento de prueba dos')).toBe('Subir Documento de prueba dos');
    expect(
      fila(el, 'Documento de prueba dos')
        .querySelector('.doc__boton mat-icon')
        ?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('(10) "Progreso de carga: 2 de 3 documentos presentados." y el progressbar con sus valores', async () => {
    const { el } = await abrir(of(CHECKLIST_2_DE_3));

    expect(texto(el.querySelector('.progreso-texto'))).toBe(
      'Progreso de carga: 2 de 3 documentos presentados.',
    );
    const barra = el.querySelector('[role="progressbar"]')!;
    expect(barra.getAttribute('aria-label')).toBe('Progreso de carga');
    expect(barra.getAttribute('aria-valuemin')).toBe('0');
    expect(barra.getAttribute('aria-valuemax')).toBe('3');
    expect(barra.getAttribute('aria-valuenow')).toBe('2');
    expect(el.querySelector('ol[aria-label="Pasos"] [aria-current="step"]')?.textContent).toContain(
      '2 · Documentos',
    );
  });

  it('(11) "Falta 1 documento." (no "Faltan 1"), "Faltan 2 documentos." y todo presentado, unidos al botón', async () => {
    const motivo = (el: HTMLElement) => texto(el.querySelector('#np-envio-motivo'));

    let { el } = await abrir(of(CHECKLIST_2_DE_3));
    expect(motivo(el)).toBe('Falta 1 documento.');
    expect(texto(el)).not.toContain('Faltan 1');
    expect(botonEnviar(el).getAttribute('aria-describedby')).toBe('np-envio-motivo');
    expect(botonEnviar(el).disabled).toBeTrue();

    ({ el } = await abrir(
      of([
        requisito(21, 'Documento de prueba A', 'NO_PRESENTADO'),
        requisito(22, 'Documento de prueba B', 'RECHAZADO'),
        requisito(23, 'Documento de prueba C', 'PRESENTADO'),
      ]),
    ));
    expect(motivo(el)).toBe('Faltan 2 documentos.');
    expect(botonEnviar(el).disabled).toBeTrue();

    ({ el } = await abrir(of([requisito(31, 'Documento de prueba listo', 'PRESENTADO')])));
    expect(motivo(el)).toBe(TODOS_PRESENTADOS);
    expect(el.querySelector('#np-envio-motivo')?.classList).toContain('envio-motivo--completo');
    expect(botonEnviar(el).disabled).toBeFalse();
    expect(texto(botonEnviar(el))).toBe('Siguiente paso');
  });

  it('con faltantes, onEnviarFinal no llama al backend ni a la carga masiva', async () => {
    const { page } = await abrir(of(CHECKLIST_2_DE_3));

    page.onEnviarFinal();

    expect(finalizarSpy).not.toHaveBeenCalled();
    expect(subirBulkSpy).not.toHaveBeenCalled();
  });

  it('con todo presentado, Siguiente paso y Enviar llaman a finalizarProtocolo con el id del borrador', async () => {
    const { fixture, el } = await abrir(
      of([requisito(31, 'Documento de prueba listo', 'PRESENTADO')]),
    );

    botonEnviar(el).click();
    fixture.detectChanges();
    (el.querySelector('button.submit-btn') as HTMLButtonElement).click();

    expect(finalizarSpy).toHaveBeenCalledOnceWith(5);
  });

  it('(12) error de subida: el mensaje del backend en la fila de ese documento, unido a su botón', async () => {
    const subida = new Subject<unknown>();
    subirSpy.and.returnValue(subida);
    const { fixture, el } = await abrir(of(CHECKLIST_2_DE_3));
    const filaDos = fila(el, 'Documento de prueba dos');
    const input = filaDos.querySelector('input[type="file"]') as HTMLInputElement;
    const archivo = new File(['zz'], 'zz-test-documento.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [archivo] });

    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(subirSpy).toHaveBeenCalledOnceWith(archivo, 5, 12);
    const boton = filaDos.querySelector('.doc__boton') as HTMLButtonElement;
    expect(texto(boton)).toBe('uploadSubiendo…');
    expect(boton.disabled).toBeTrue();
    expect(botonEnviar(el).disabled).toBeTrue();

    subida.error(new Error(MENSAJE_PDF));
    fixture.detectChanges();

    const error = filaDos.querySelector('#np-doc-12-error');
    expect(texto(error)).toBe(MENSAJE_PDF);
    expect(boton.getAttribute('aria-describedby')).toBe('np-doc-12-error');
    expect(boton.disabled).toBeFalse();
    expect(texto(boton)).toBe('uploadSubir');
    expect(fila(el, 'Documento de prueba uno').querySelector('.doc__error')).toBeNull();
    expect(texto(el)).not.toContain('Error al subir documento');
  });

  it('después de subir vuelve a pedir el checklist y la fila pasa a "Presentado" con "Cambiar"', async () => {
    subirSpy.and.returnValue(of({}));
    const { fixture, el } = await abrir(of(CHECKLIST_2_DE_3));
    obtenerChecklistSpy.and.returnValue(
      of(CHECKLIST_2_DE_3.map((r) => ({ ...r, status: 'PRESENTADO' }))),
    );
    const input = fila(el, 'Documento de prueba dos').querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [new File(['zz'], 'zz-test-documento.pdf', { type: 'application/pdf' })],
    });

    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(obtenerChecklistSpy).toHaveBeenCalledTimes(2);
    expect(
      fila(el, 'Documento de prueba dos').querySelector('.doc__boton')?.getAttribute('aria-label'),
    ).toBe('Cambiar Documento de prueba dos');
    expect(texto(el.querySelector('#np-envio-motivo'))).toBe(TODOS_PRESENTADOS);
  });

  it('dos subidas seguidas: una recarga vieja que llega tarde no pisa la nueva (code-review)', async () => {
    subirSpy.and.returnValue(of({}));
    const { fixture, el } = await abrir(
      of([
        requisito(61, 'Documento de prueba A', 'NO_PRESENTADO'),
        requisito(62, 'Documento de prueba B', 'NO_PRESENTADO'),
      ]),
    );
    const recargaVieja = new Subject<unknown[]>();
    const recargaNueva = new Subject<unknown[]>();
    obtenerChecklistSpy.and.returnValues(recargaVieja, recargaNueva);
    const elegir = (nombre: string) => {
      const input = fila(el, nombre).querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, 'files', {
        value: [new File(['zz'], 'zz-test-documento.pdf', { type: 'application/pdf' })],
      });
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };

    elegir('Documento de prueba A');
    elegir('Documento de prueba B');
    recargaNueva.next([
      requisito(61, 'Documento de prueba A', 'PRESENTADO'),
      requisito(62, 'Documento de prueba B', 'PRESENTADO'),
    ]);
    recargaVieja.next([
      requisito(61, 'Documento de prueba A', 'PRESENTADO'),
      requisito(62, 'Documento de prueba B', 'NO_PRESENTADO'),
    ]);
    fixture.detectChanges();

    expect(texto(el.querySelector('#np-envio-motivo'))).toBe(TODOS_PRESENTADOS);
    expect(botonEnviar(el).disabled).toBeFalse();
  });

  it('(13) APROBADO: "Presentado" sin botón Cambiar', async () => {
    const { el } = await abrir(
      of([
        requisito(41, 'Documento de prueba aprobado', 'APROBADO'),
        requisito(42, 'Documento de prueba pendiente', 'PENDIENTE'),
      ]),
    );

    const aprobado = fila(el, 'Documento de prueba aprobado');
    expect(texto(aprobado.querySelector('.doc__estado--presentado'))).toBe(
      'check_circlePresentado',
    );
    expect(aprobado.querySelector('button')).toBeNull();
    expect(aprobado.querySelector('input[type="file"]')).toBeNull();
    expect(texto(el.querySelector('.progreso-texto'))).toBe(
      'Progreso de carga: 1 de 2 documentos presentados.',
    );
    expect(
      fila(el, 'Documento de prueba pendiente')
        .querySelector('.doc__boton')
        ?.getAttribute('aria-label'),
    ).toBe('Subir Documento de prueba pendiente');
  });

  it('(14) NO_APLICA: "No aplica" sin botón; no cuenta en el total ni bloquea el envío', async () => {
    const { el } = await abrir(
      of([
        requisito(51, 'Documento de prueba presentado', 'PRESENTADO'),
        requisito(52, 'Documento de prueba que no aplica', 'NO_APLICA'),
      ]),
    );

    const noAplica = fila(el, 'Documento de prueba que no aplica');
    expect(texto(noAplica.querySelector('.doc__estado--no-aplica'))).toBe('No aplica');
    expect(noAplica.querySelector('.doc__estado--presentado')).toBeNull();
    expect(noAplica.querySelector('button')).toBeNull();
    expect(texto(el.querySelector('.progreso-texto'))).toBe(
      'Progreso de carga: 1 de 1 documentos presentados.',
    );
    expect(el.querySelector('[role="progressbar"]')?.getAttribute('aria-valuemax')).toBe('1');
    expect(texto(el.querySelector('#np-envio-motivo'))).toBe(TODOS_PRESENTADOS);
    expect(botonEnviar(el).disabled).toBeFalse();
  });

  describe('C4: paso 3 Enviar a la Secretaría y revisión del archivo (D17, D19)', () => {
    // Copias escritas a mano de D17 y D19 en specs/F09-investigador-borrador-envio/spec-ui.md (v0.8).
    const SUBTITULO_ENVIO = 'Paso 3 de 3: Enviar a la Secretaría';
    const TEXTO_ENVIO_3 =
      'Los 3 documentos están presentados. Al enviar ya no puede cambiarlos hasta que la Secretaría los revise.';
    const TEXTO_ENVIO_1 =
      'El documento está presentado. Al enviar ya no puede cambiarlo hasta que la Secretaría lo revise.';
    const EXITO_TITULO = 'Protocolo enviado a la Secretaría.';
    const EXITO_CORREO = 'Le llegará un correo del CEISH con el resultado de la revisión.';
    const NO_PDF = 'El archivo debe estar en formato PDF.';
    const MENSAJE_BACKEND =
      'El protocolo no se puede enviar en su estado actual: solo se envía un borrador o un protocolo con documentación incompleta o por subsanar.';

    const TRES_PRESENTADOS = [
      requisito(71, 'Documento de prueba uno', 'PRESENTADO'),
      requisito(72, 'Documento de prueba dos', 'APROBADO'),
      requisito(73, 'Documento de prueba tres', 'PRESENTADO'),
      requisito(74, 'Documento de prueba que no aplica', 'NO_APLICA'),
    ];

    const tarjetaEnvio = (el: HTMLElement) => el.querySelector('section.envio-card') as HTMLElement;
    const botonEnvio = (el: HTMLElement) =>
      el.querySelector('section.envio-card button.submit-btn') as HTMLButtonElement;
    const botonAtras = (el: HTMLElement) =>
      el.querySelector('section.envio-card button.atras-btn') as HTMLButtonElement;
    const subtitulo = (el: HTMLElement) => texto(el.querySelector('app-page-header p'));

    async function irAlPaso3(checklist: unknown[] = TRES_PRESENTADOS) {
      const r = await abrir(of(checklist));
      botonEnviar(r.el).click();
      r.fixture.detectChanges();
      await r.fixture.whenStable();
      r.fixture.detectChanges();
      return r;
    }

    function elegirArchivo(input: HTMLInputElement, nombre: string): () => string {
      // El navegador no deja escribir el value de un input de archivo: se simula para ver si se vacía.
      let valor = 'C:\\fakepath\\' + nombre;
      Object.defineProperty(input, 'value', {
        configurable: true,
        get: () => valor,
        set: (v: string) => (valor = v),
      });
      Object.defineProperty(input, 'files', {
        configurable: true,
        value: [new File(['zz'], nombre, { type: 'application/octet-stream' })],
      });
      input.dispatchEvent(new Event('change'));
      return () => valor;
    }

    it('(1) en el paso 2 no está "Enviar a la Secretaría": está "Siguiente paso", deshabilitado con faltantes y unido al motivo', async () => {
      const { el } = await abrir(of(CHECKLIST_2_DE_3));
      const paso2 = el.querySelector('.step-content--documentos') as HTMLElement;

      const textos = Array.from(paso2.querySelectorAll('button')).map((b) => texto(b));
      expect(textos).not.toContain('Enviar a la Secretaría');
      expect(paso2.querySelector('.atras-btn')).toBeNull();
      const siguiente = paso2.querySelector('button.siguiente-btn') as HTMLButtonElement;
      expect(texto(siguiente)).toBe('Siguiente paso');
      expect(siguiente.disabled).toBeTrue();
      expect(siguiente.getAttribute('aria-describedby')).toBe('np-envio-motivo');
      expect(texto(el.querySelector('#np-envio-motivo'))).toBe('Falta 1 documento.');
    });

    it('(2) con todo presentado, "Siguiente paso" abre el paso 3: subtítulo, aria-current y foco en el h2', async () => {
      const { page, el } = await irAlPaso3();

      expect(page.stepper.selectedIndex).toBe(2);
      expect(subtitulo(el)).toBe(SUBTITULO_ENVIO);
      const actual = el.querySelector('ol[aria-label="Pasos"] [aria-current="step"]');
      expect(texto(actual)).toBe('3 · Enviar a la Secretaría, paso actual');
      expect(actual?.classList).toContain('pasos__item--hecho');
      const titulo = tarjetaEnvio(el).querySelector('h2') as HTMLElement;
      expect(texto(titulo)).toBe('Enviar a la Secretaría');
      expect(titulo.getAttribute('tabindex')).toBe('-1');
      expect(document.activeElement).toBe(titulo);
      // D29 (C5): la tarjeta se nombra con su h2, sin repetir el texto en aria-label.
      expect(tarjetaEnvio(el).getAttribute('aria-label')).toBeNull();
      expect(tarjetaEnvio(el).getAttribute('aria-labelledby')).toBe('np-envio-titulo');
      expect(titulo.id).toBe('np-envio-titulo');
    });

    it('(3) el texto del paso 3 con M = 3 (sin NO_APLICA) y con M = 1 en singular', async () => {
      let { el } = await irAlPaso3();
      expect(texto(tarjetaEnvio(el).querySelector('.envio-card__texto'))).toBe(TEXTO_ENVIO_3);
      expect(texto(el)).not.toContain('La fecha de recepción');

      ({ el } = await irAlPaso3([requisito(81, 'Documento de prueba solo', 'PRESENTADO')]));
      expect(texto(tarjetaEnvio(el).querySelector('.envio-card__texto'))).toBe(TEXTO_ENVIO_1);
    });

    it('(4) "Atrás" vuelve al paso 2 con la lista intacta y sin pedir otra vez el checklist', async () => {
      const { fixture, page, el } = await irAlPaso3();
      const pedidos = obtenerChecklistSpy.calls.count();

      expect(texto(botonAtras(el))).toBe('Atrás');
      botonAtras(el).click();
      fixture.detectChanges();

      expect(page.stepper.selectedIndex).toBe(1);
      expect(obtenerChecklistSpy.calls.count()).toBe(pedidos);
      expect(filas(el).length).toBe(4);
      expect(subtitulo(el)).toBe('Paso 2 de 3: Documentos');
    });

    it('(5) envío exitoso: aviso role="status" con los textos y el enlace; botones deshabilitados; sin snackbar ni navegación', async () => {
      finalizarSpy.and.returnValue(of({}));
      const { fixture, el } = await irAlPaso3();
      const snackSpy = spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open');
      const navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      const region = tarjetaEnvio(el).querySelector('[role="status"]') as HTMLElement;
      expect(region).withContext('contenedor role="status" antes de enviar').not.toBeNull();
      expect(texto(region)).toBe('');

      botonEnvio(el).click();
      fixture.detectChanges();

      expect(tarjetaEnvio(el).querySelector('[role="status"]')).toBe(region);
      expect(texto(region.querySelector('strong'))).toBe(EXITO_TITULO);
      expect(texto(region)).toContain(EXITO_CORREO);
      const enlace = region.querySelector('a') as HTMLAnchorElement;
      expect(texto(enlace)).toBe('Ir a Mis protocolos');
      expect(enlace.getAttribute('href')).toBe('/dashboard/investigador/mis-protocolos');
      expect(botonEnvio(el).disabled).toBeTrue();
      expect(botonAtras(el).disabled).toBeTrue();
      expect(snackSpy).not.toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(tarjetaEnvio(el).querySelector('[role="alert"]')).toBeNull();
    });

    it('(6) envío con error: role="alert" con el mensaje del backend y los botones habilitados otra vez', async () => {
      finalizarSpy.and.returnValue(throwError(() => new Error(MENSAJE_BACKEND)));
      const { fixture, el } = await irAlPaso3();

      botonEnvio(el).click();
      fixture.detectChanges();

      const alerta = tarjetaEnvio(el).querySelector('[role="alert"]');
      expect(texto(alerta)).toBe(MENSAJE_BACKEND);
      expect(alerta?.querySelector('*')).toBeNull();
      expect(botonEnvio(el).disabled).toBeFalse();
      expect(botonAtras(el).disabled).toBeFalse();
      expect(texto(botonEnvio(el))).toBe('Enviar a la Secretaría');
      expect(texto(tarjetaEnvio(el).querySelector('[role="status"]'))).toBe('');

      // Al volver al paso 2 y regresar, el error anterior ya no se muestra (code-review).
      botonAtras(el).click();
      fixture.detectChanges();
      botonEnviar(el).click();
      fixture.detectChanges();
      expect(tarjetaEnvio(el).querySelector('[role="alert"]')).toBeNull();
    });

    it('(7) mientras se envía: "Enviando…" y los dos botones deshabilitados', async () => {
      finalizarSpy.and.returnValue(NEVER);
      const { fixture, el } = await irAlPaso3();

      botonEnvio(el).click();
      fixture.detectChanges();

      expect(texto(botonEnvio(el))).toBe('Enviando…');
      expect(botonEnvio(el).disabled).toBeTrue();
      expect(botonAtras(el).disabled).toBeTrue();
      botonEnvio(el).click();
      expect(finalizarSpy).toHaveBeenCalledTimes(1);
    });

    it('(10) un archivo que no es PDF: "El archivo debe estar en formato PDF." en su fila, unido al botón, sin llamar a la subida', async () => {
      const { fixture, el } = await abrir(of(CHECKLIST_2_DE_3));
      const filaDos = fila(el, 'Documento de prueba dos');

      elegirArchivo(filaDos.querySelector('input[type="file"]') as HTMLInputElement, 'zz-test-documento.docx');
      fixture.detectChanges();

      expect(subirSpy).not.toHaveBeenCalled();
      expect(texto(filaDos.querySelector('#np-doc-12-error'))).toBe(NO_PDF);
      expect(filaDos.querySelector('.doc__boton')?.getAttribute('aria-describedby')).toBe(
        'np-doc-12-error',
      );

      // Misma regla que el backend: el nombre en minúsculas termina en .pdf.
      elegirArchivo(filaDos.querySelector('input[type="file"]') as HTMLInputElement, 'ZZ-TEST.PDF');
      fixture.detectChanges();
      expect(subirSpy).toHaveBeenCalledTimes(1);
      expect(filaDos.querySelector('#np-doc-12-error')).toBeNull();
    });

    it('(11) después de un error el input de archivo queda vacío', async () => {
      const subida = new Subject<unknown>();
      subirSpy.and.returnValue(subida);
      const { fixture, el } = await abrir(of(CHECKLIST_2_DE_3));
      const input = () =>
        fila(el, 'Documento de prueba dos').querySelector('input[type="file"]') as HTMLInputElement;

      const valorNoPdf = elegirArchivo(input(), 'zz-test-documento.txt');
      fixture.detectChanges();
      expect(valorNoPdf()).toBe('');

      const valorPdf = elegirArchivo(input(), 'zz-test-documento.pdf');
      subida.error(new Error(MENSAJE_PDF));
      fixture.detectChanges();
      expect(texto(el.querySelector('#np-doc-12-error'))).toBe(MENSAJE_PDF);
      expect(valorPdf()).toBe('');
    });

    it('(12) la región viva del progreso existe antes de la lista y su texto cambia después de una subida', async () => {
      const checklist = new Subject<unknown[]>();
      subirSpy.and.returnValue(of({}));
      const { fixture, el } = await abrir(checklist);
      const region = el.querySelector('.progreso-region') as HTMLElement;

      expect(region).withContext('región presente mientras carga').not.toBeNull();
      expect(region.getAttribute('aria-live')).toBe('polite');
      expect(texto(region)).toBe('');

      checklist.next(CHECKLIST_2_DE_3);
      fixture.detectChanges();
      expect(el.querySelector('.progreso-region')).toBe(region);
      expect(texto(region)).toBe('Progreso de carga: 2 de 3 documentos presentados.');

      obtenerChecklistSpy.and.returnValue(
        of(CHECKLIST_2_DE_3.map((r) => ({ ...r, status: 'PRESENTADO' }))),
      );
      elegirArchivo(
        fila(el, 'Documento de prueba dos').querySelector('input[type="file"]') as HTMLInputElement,
        'zz-test-documento.pdf',
      );
      fixture.detectChanges();
      expect(el.querySelector('.progreso-region')).toBe(region);
      expect(texto(region)).toBe('Progreso de carga: 3 de 3 documentos presentados.');
    });

    it('(13) la barra del paso 2 dice con texto oculto "completado", "paso actual" y "pendiente"', async () => {
      const { el } = await abrir(of(CHECKLIST_2_DE_3));
      const items = Array.from(el.querySelectorAll('ol[aria-label="Pasos"] > li'));

      expect(items.map((li) => texto(li))).toEqual([
        '1 · Datos, completado',
        '2 · Documentos, paso actual',
        '3 · Enviar a la Secretaría, pendiente',
      ]);
      expect(items.map((li) => texto(li.querySelector('.visually-hidden')))).toEqual([
        ', completado',
        ', paso actual',
        ', pendiente',
      ]);
      expect(items.map((li) => li.getAttribute('aria-current'))).toEqual([null, 'step', null]);
    });

    it('(16) con "Siguiente paso" deshabilitado no se abre el paso 3 ni se llama a finalizarProtocolo', async () => {
      const { page } = await abrir(of(CHECKLIST_2_DE_3));

      page.siguientePaso();
      page.onEnviarFinal();

      expect(page.stepper.selectedIndex).toBe(1);
      expect(finalizarSpy).not.toHaveBeenCalled();
    });
  });

  describe('C5: Descargar formato con templateCode (D28, F09-22)', () => {
    // Copias escritas a mano de D28 (spec-ui v1.0).
    const NO_DISPONIBLE = 'Este formato no está disponible.';
    const ERROR_FORMATO = 'No pudimos descargar el formato. Intente de nuevo.';
    const CODIGO = 'ZZ_TEST_FORMATO';
    const URL_BUENA = 'https://zz-test.invalid/formatos/zz-test.docx';

    const CON_FORMATO = [
      requisito(11, 'Documento de prueba uno', 'PRESENTADO'),
      { ...requisito(12, 'Documento de prueba dos', 'NO_PRESENTADO'), templateCode: CODIGO },
      { ...requisito(13, 'Documento de prueba tres', 'PRESENTADO'), templateCode: null },
      { ...requisito(14, 'Documento de prueba cuatro', 'PRESENTADO'), templateCode: '  ' },
      { ...requisito(15, 'Documento de prueba cinco', 'PRESENTADO'), templateCode: ` ${CODIGO}_5 ` },
    ];

    interface PestanaFalsa {
      opener: unknown;
      location: { href: string };
      close: jasmine.Spy;
    }

    let orden: string[];
    let pestana: PestanaFalsa;
    let abrirSpy: jasmine.Spy;

    beforeEach(() => {
      orden = [];
      pestana = { opener: {}, location: { href: '' }, close: jasmine.createSpy('close') };
      abrirSpy = spyOn(window, 'open').and.callFake(() => {
        orden.push('abrir');
        return pestana as unknown as Window;
      });
    });

    /** La petición se cuenta al suscribirse (cuando sale de verdad), no al llamar al método. */
    function responder(respuesta: Observable<unknown>): void {
      downloadTemplateSpy.and.callFake(() =>
        defer(() => {
          orden.push('pedir');
          return respuesta;
        }),
      );
    }

    const botonFormato = (el: HTMLElement, nombre = 'Documento de prueba dos') =>
      fila(el, nombre).querySelector('button.doc__formato') as HTMLButtonElement | null;
    const errorDe = (el: HTMLElement) =>
      el.querySelector('#np-doc-12-formato-error') as HTMLElement | null;

    it('solo la fila con templateCode tiene el botón, después de Subir, con su aria-label', async () => {
      const { page, el } = await abrir(of(CON_FORMATO));

      expect(page.documentosRequeridos.map((d) => d.codigoFormato)).toEqual([
        null,
        CODIGO,
        null,
        null,
        `${CODIGO}_5`,
      ]);
      expect(el.querySelectorAll('button.doc__formato').length).toBe(2);
      expect(botonFormato(el, 'Documento de prueba tres')).toBeNull();
      expect(botonFormato(el, 'Documento de prueba cuatro')).toBeNull();
      const acciones = fila(el, 'Documento de prueba dos').querySelector('.doc__acciones')!;
      expect(Array.from(acciones.querySelectorAll('button')).map((n) => texto(n))).toEqual([
        'uploadSubir',
        'Descargar formato',
      ]);
      expect(botonFormato(el)!.getAttribute('aria-label')).toBe(
        'Descargar formato de Documento de prueba dos',
      );
      expect(botonFormato(el)!.getAttribute('aria-describedby')).toBeNull();
      expect(el.querySelector('a.doc__formato')).toBeNull();
    });

    it('la pestaña se abre en el clic antes de pedir la URL, sin opener, y luego va a la URL', async () => {
      const respuesta$ = new Subject<{ downloadUrl: string }>();
      responder(respuesta$);
      const { fixture, el } = await abrir(of(CON_FORMATO));

      botonFormato(el)!.click();
      fixture.detectChanges();

      expect(orden).toEqual(['abrir', 'pedir']);
      expect(abrirSpy).toHaveBeenCalledOnceWith('', '_blank');
      expect(pestana.opener).toBeNull();
      expect(downloadTemplateSpy).toHaveBeenCalledOnceWith(CODIGO);
      expect(texto(botonFormato(el))).toBe('Descargando…');
      expect(botonFormato(el)!.disabled).toBeTrue();
      expect(pestana.location.href).toBe('');

      respuesta$.next({ downloadUrl: URL_BUENA });
      respuesta$.complete();
      fixture.detectChanges();

      expect(pestana.location.href).toBe(URL_BUENA);
      expect(pestana.close).not.toHaveBeenCalled();
      expect(texto(botonFormato(el))).toBe('Descargar formato');
      expect(botonFormato(el)!.disabled).toBeFalse();
      expect(errorDe(el)).toBeNull();
    });

    it('cada clic vuelve a pedir la URL (no se guarda)', async () => {
      responder(of({ downloadUrl: URL_BUENA }));
      const { fixture, el } = await abrir(of(CON_FORMATO));

      botonFormato(el)!.click();
      fixture.detectChanges();
      botonFormato(el)!.click();
      fixture.detectChanges();

      expect(downloadTemplateSpy).toHaveBeenCalledTimes(2);
      expect(orden).toEqual(['abrir', 'pedir', 'abrir', 'pedir']);
    });

    it('acepta http solo con localhost o 127.0.0.1', async () => {
      const { fixture, el } = await abrir(of(CON_FORMATO));
      for (const url of ['http://localhost:9000/zz-test.docx', 'http://127.0.0.1/zz-test.docx']) {
        pestana.location.href = '';
        responder(of({ downloadUrl: url }));
        botonFormato(el)!.click();
        fixture.detectChanges();
        expect(pestana.location.href).withContext(url).toBe(url);
      }
      expect(pestana.close).not.toHaveBeenCalled();
      expect(errorDe(el)).toBeNull();
    });

    for (const [caso, respuesta] of [
      ['http externo', { downloadUrl: 'http://zz-test.invalid/zz-test.docx' }],
      ['javascript:', { downloadUrl: 'javascript:alert(1)' }],
      ['URL vacía', { downloadUrl: '' }],
      ['sin downloadUrl', {}],
      ['URL que no se puede leer', { downloadUrl: 'no es una url' }],
    ] as const) {
      it(`URL que no pasa la comprobación (${caso}): cierra la pestaña y muestra el error genérico`, async () => {
        responder(of(respuesta));
        const { fixture, el } = await abrir(of(CON_FORMATO));

        botonFormato(el)!.click();
        fixture.detectChanges();

        expect(pestana.close).toHaveBeenCalledTimes(1);
        expect(pestana.location.href).toBe('');
        expect(texto(errorDe(el))).toBe(ERROR_FORMATO);
        expect(errorDe(el)!.getAttribute('role')).toBe('alert');
        expect(botonFormato(el)!.getAttribute('aria-describedby')).toBe('np-doc-12-formato-error');
        expect(botonFormato(el)!.disabled).toBeFalse();
      });
    }

    for (const [status, esperado] of [
      [404, NO_DISPONIBLE],
      [500, ERROR_FORMATO],
      [0, ERROR_FORMATO],
    ] as const) {
      it(`petición con error ${status}: cierra la pestaña y muestra "${esperado}" sin el mensaje del backend`, async () => {
        responder(
          throwError(() => ({
            status,
            error: { error: { message: `Plantilla con código ${CODIGO} no encontrada o sin archivo asignado.` } },
          })),
        );
        const { fixture, el } = await abrir(of(CON_FORMATO));

        botonFormato(el)!.click();
        fixture.detectChanges();

        expect(pestana.close).toHaveBeenCalledTimes(1);
        expect(texto(errorDe(el))).toBe(esperado);
        expect(texto(el)).not.toContain(CODIGO);
      });
    }

    it('el código se manda recortado', async () => {
      responder(of({ downloadUrl: URL_BUENA }));
      const { fixture, el } = await abrir(of(CON_FORMATO));

      botonFormato(el, 'Documento de prueba cinco')!.click();
      fixture.detectChanges();

      expect(downloadTemplateSpy).toHaveBeenCalledOnceWith(`${CODIGO}_5`);
    });

    it('si la petición termina sin respuesta: cierra la pestaña, error genérico y el botón vuelve', async () => {
      responder(EMPTY);
      const { fixture, el } = await abrir(of(CON_FORMATO));

      botonFormato(el)!.click();
      fixture.detectChanges();

      expect(pestana.close).toHaveBeenCalledTimes(1);
      expect(texto(errorDe(el))).toBe(ERROR_FORMATO);
      expect(texto(botonFormato(el))).toBe('Descargar formato');
      expect(botonFormato(el)!.disabled).toBeFalse();
    });

    it('si el navegador no abre la pestaña: error genérico y no se pide la URL', async () => {
      abrirSpy.and.returnValue(null);
      const { fixture, el } = await abrir(of(CON_FORMATO));

      botonFormato(el)!.click();
      fixture.detectChanges();

      expect(downloadTemplateSpy).not.toHaveBeenCalled();
      expect(texto(errorDe(el))).toBe(ERROR_FORMATO);
      expect(texto(botonFormato(el))).toBe('Descargar formato');
    });

    it('el error de la descarga va en su propia región, separado del error de subida', async () => {
      responder(throwError(() => ({ status: 404 })));
      const { fixture, page, el } = await abrir(of(CON_FORMATO));

      botonFormato(el)!.click();
      fixture.detectChanges();
      const subir = fila(el, 'Documento de prueba dos').querySelector('.doc__boton')!;
      expect(subir.getAttribute('aria-describedby')).toBeNull();
      expect(el.querySelector('#np-doc-12-error')).toBeNull();

      const evento = {
        target: { files: [new File(['x'], 'zz-test-documento.docx')], value: '' },
      } as unknown as Event;
      page.onDocumentSelected(evento, page.documentosRequeridos[1]);
      fixture.detectChanges();

      const alertas = Array.from(
        fila(el, 'Documento de prueba dos').querySelectorAll('[role="alert"]'),
      ).map((n) => [n.id, texto(n)]);
      expect(alertas).toEqual([
        ['np-doc-12-error', 'El archivo debe estar en formato PDF.'],
        ['np-doc-12-formato-error', NO_DISPONIBLE],
      ]);
      expect(subir.getAttribute('aria-describedby')).toBe('np-doc-12-error');
      expect(botonFormato(el)!.getAttribute('aria-describedby')).toBe('np-doc-12-formato-error');
    });

    it('si la página se destruye antes de la respuesta, la pestaña vacía se cierra', async () => {
      responder(NEVER);
      const { fixture, el } = await abrir(of(CON_FORMATO));

      botonFormato(el)!.click();
      fixture.detectChanges();
      expect(pestana.close).not.toHaveBeenCalled();

      fixture.destroy();
      expect(pestana.close).toHaveBeenCalledTimes(1);
    });
  });

  it('el paso 2 no usa clases de Bootstrap ni avisos con ⚠️, ✅ o ❌', async () => {
    const { el } = await abrir(of(CHECKLIST_2_DE_3));
    const paso2 = el.querySelector('.step-content--documentos')!;

    for (const clase of [
      'row',
      'col',
      'col-auto',
      'd-flex',
      'fw-bold',
      'badge',
      'text-muted',
      'bg-success',
      'list-group',
    ]) {
      expect(paso2.querySelector('.' + clase))
        .withContext(clase)
        .toBeNull();
    }
    expect(paso2.querySelector('[style]:not(.progreso__valor)')).toBeNull();
    expect(texto(paso2)).not.toMatch(/⚠️|✅|❌/);
  });
});
