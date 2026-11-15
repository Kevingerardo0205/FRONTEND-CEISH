import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  // Copias escritas a mano de specs/F09-investigador-borrador-envio/spec-ui.md §3.2 y D13 (v0.4).
  const MIS_PROTOCOLOS_HREF = '/dashboard/investigador/mis-protocolos';
  const TITULO = 'Nuevo protocolo';
  const SUBTITULO =
    'Primero los datos básicos. Se guarda como borrador; nadie del comité lo ve hasta que lo envíe.';

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
  });
});

describe('NuevoProtocoloPage — paso 1 Datos (F09-9, C2 y C2b)', () => {
  // Copias escritas a mano de las filas C2 y C2b de specs/F09-investigador-borrador-envio/tasks.md
  // (v0.4; C2b reemplaza los textos de C2).
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
    'Declaro bajo juramento que la investigación no ha iniciado su fase de campo y que la información es veraz. Si el CEISH detecta que ya empezó, el protocolo se archiva con el motivo.';
  const DECLARACION_NEGRITA = 'Declaro bajo juramento';
  const ERROR_DECLARACION = 'Debe aceptar la declaración jurada para continuar.';
  const BOTON = 'Guardar borrador y continuar';
  const MOTIVO_TODO = 'Falta: el título, el tipo de estudio y la declaración.';
  const MOTIVO_TITULO_DECLARACION = 'Falta: el título y la declaración.';
  const MOTIVO_DECLARACION = 'Falta: la declaración.';
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

    page.generalForm.patchValue({ tipoEstudio: '1' });
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

  it('la declaración dice el texto del diseño con "Declaro bajo juramento" en negrita', () => {
    const { el } = render();

    const declaracion = el.querySelector('.legal-box mat-checkbox label');
    expect(texto(declaracion)).toBe(DECLARACION);
    expect(texto(declaracion?.querySelector('strong'))).toBe(DECLARACION_NEGRITA);
  });

  it('las características van en un fieldset con su legend y cada casilla cambia su campo', () => {
    const { fixture, page, el } = render();

    const casillas = Array.from(fieldsetDe(el, LEYENDA).querySelectorAll('mat-checkbox'));
    expect(casillas.map((c) => texto(c.querySelector('label')))).toEqual(
      CARACTERISTICAS.map(([etiqueta]) => etiqueta),
    );

    casillas.forEach((casilla, i) => {
      const [etiqueta, campo] = CARACTERISTICAS[i];
      (casilla.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
      fixture.detectChanges();
      const valores = page.generalForm.getRawValue() as Record<string, unknown>;
      expect(valores[campo]).withContext(etiqueta).toBeTrue();
    });
  });

  it('no hay textos en mayúsculas ni los de C2 y el botón dice "Guardar borrador y continuar"', () => {
    const { el } = render();

    expect(el.textContent).not.toContain('REGISTRAR Y CONTINUAR');
    expect(el.textContent).not.toContain('Registrar y continuar');
    expect(el.textContent).not.toContain('--- SELECCIONE ---');
    expect(el.textContent).not.toContain('DECLARO BAJO JURAMENTO');
    expect(el.textContent).not.toContain('Falta completar');
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

  it('el subtítulo de D13 solo se ve en el paso 1; el paso 2 conserva el de C1 (C2b)', async () => {
    // Copias escritas a mano de la fila C2b de specs/F09-investigador-borrador-envio/tasks.md.
    const subtituloDatos =
      'Primero los datos básicos. Se guarda como borrador; nadie del comité lo ve hasta que lo envíe.';
    const subtituloDocumentos =
      'Complete la información básica y cargue la documentación requerida por el CEISH.';
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
