import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER, Observable, Subject, of, throwError } from 'rxjs';

import { MisProtocolosPage } from './mis-protocolos.page';
import { ProtocoloService } from '../../../application/services/protocolo.service';
import { ProtocoloResumen, EstadoProtocolo } from '../../../domain/dtos/crear-protocolo.dto';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { AuthFacade } from '@features/auth/facades/auth.facade';

/**
 * Mis protocolos (F09 D20 a D26, MP1; T09-2 y T09-4 siguen). Plantilla real; los textos se
 * comparan con copias escritas a mano de spec-ui v0.9.
 */

// --- Textos copiados a mano de spec-ui v0.9 ---
const TXT_TITULO = 'Mis protocolos';
const TXT_SUBTITULO = 'Lo que necesita algo de usted aparece primero.';
const TXT_ACCION = 'Necesita su acción';
const TXT_COMITE = 'En el comité';
const TXT_ARCHIVADOS = 'Archivados';
const TXT_SIN_CODIGO = 'sin código hasta que la Secretaría lo reciba';
const TXT_VEINTE_DIAS = 'Si no acepta los tiempos en 20 días, el proceso se archiva.';
const TXT_CONSTANCIA = 'La Secretaría le envía la constancia de recepción por correo.';
const TXT_CASILLA =
  'Acepto los tiempos de evaluación y las reglas del comité indicados en la constancia de recepción.';
const TXT_COINVESTIGADOR = 'El investigador principal debe aceptar los tiempos.';
const TXT_ERROR_ACEPTAR = 'No pudimos registrar su aceptación. Intente de nuevo.';
const TXT_CARGANDO = 'Cargando sus protocolos…';
const TXT_ERROR_LISTA = 'No pudimos cargar sus protocolos.';
const TXT_VACIO = 'Todavía no tiene protocolos.';
const TXT_ESPERANDO = 'Esperando la revisión de la Secretaría';
const TXT_PRESIDENTA = 'La Presidenta asignará a los pares evaluadores';
const TXT_PARES = 'En revisión por sus pares evaluadores';

const USUARIO_ID = 30;

function protocolo(id: number, cambios: Partial<ProtocoloResumen>): ProtocoloResumen {
  return {
    id,
    codigoCeish: '',
    titulo: `Estudio de prueba numero ${id} del investigador`,
    estado: EstadoProtocolo.BORRADOR,
    fechaCreacion: '2026-11-01',
    isTimelineTermsAccepted: false,
    versionNumber: 1,
    etapa: 'RECEPCION',
    statusId: null,
    checklist: [],
    submissionDeadline: null,
    principalInvestigatorId: USUARIO_ID,
    ...cambios,
  };
}

/** Una lista con cada caso de D21, en desorden a propósito. */
function listaCompleta(): ProtocoloResumen[] {
  return [
    protocolo(5, { estado: 'EN_REVISION_SECRETARIA' as EstadoProtocolo, etapa: 'RECEPCION' }),
    protocolo(4, {
      estado: 'EVALUACION_SUBSANACIONES' as EstadoProtocolo,
      codigoCeish: 'CEISH-PRUEBA-004',
      statusId: 21,
      versionNumber: 2,
    }),
    protocolo(8, { estado: EstadoProtocolo.ARCHIVADO, etapa: 'RECEPCION' }),
    protocolo(3, {
      estado: 'INCOMPLETO' as EstadoProtocolo,
      submissionDeadline: '2026-12-04',
      checklist: [{ status: 'RECHAZADO' }, { status: 'RECHAZADO' }, { status: 'PENDIENTE' }],
    }),
    protocolo(6, {
      estado: EstadoProtocolo.COMPLETO,
      codigoCeish: 'CEISH-PRUEBA-006',
      isTimelineTermsAccepted: true,
      etapa: 'ASIGNACION',
    }),
    protocolo(2, { estado: EstadoProtocolo.COMPLETO, codigoCeish: 'CEISH-PRUEBA-002', etapa: 'ASIGNACION' }),
    protocolo(7, {
      estado: EstadoProtocolo.COMPLETO,
      codigoCeish: 'CEISH-PRUEBA-007',
      isTimelineTermsAccepted: true,
      etapa: 'EVALUACION',
      statusId: 13,
    }),
    protocolo(9, {
      estado: EstadoProtocolo.COMPLETO,
      codigoCeish: 'CEISH-PRUEBA-009',
      isTimelineTermsAccepted: true,
      etapa: 'RESOLUCION',
      statusId: 17,
    }),
    protocolo(1, {
      checklist: [
        { status: 'PRESENTADO' },
        { status: 'APROBADO' },
        { status: 'NO_PRESENTADO' },
        { status: 'RECHAZADO' },
        { status: 'NO_APLICA' },
      ],
    }),
  ];
}

describe('MisProtocolosPage (F09 MP1)', () => {
  let lista$: Observable<ProtocoloResumen[]>;
  let obtenerMisProtocolos: jasmine.Spy;
  let acceptTimeline: jasmine.Spy;
  let broker$: Subject<unknown>;
  let router: Router;

  beforeEach(async () => {
    lista$ = of(listaCompleta());
    obtenerMisProtocolos = jasmine.createSpy('obtenerMisProtocolos').and.callFake(() => lista$);
    acceptTimeline = jasmine.createSpy('acceptTimeline');
    broker$ = new Subject<unknown>();

    await TestBed.configureTestingModule({
      imports: [MisProtocolosPage],
      providers: [
        provideRouter([]),
        { provide: ProtocoloService, useValue: { obtenerMisProtocolos } },
        { provide: IProtocolRepositoryPort, useValue: { acceptTimeline } },
        { provide: AuthFacade, useValue: { currentUser: () => ({ id: USUARIO_ID }) } },
        { provide: NotificationBrokerService, useValue: { on: () => broker$.asObservable() } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  function render(): ComponentFixture<MisProtocolosPage> {
    const fixture = TestBed.createComponent(MisProtocolosPage);
    fixture.detectChanges();
    return fixture;
  }

  function el(fixture: ComponentFixture<MisProtocolosPage>): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function texto(nodo: Element | null): string {
    return (nodo?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  function seccion(fixture: ComponentFixture<MisProtocolosPage>, nombre: string): HTMLElement | null {
    return el(fixture).querySelector<HTMLElement>(`[data-seccion="${nombre}"]`);
  }

  function idsEn(fixture: ComponentFixture<MisProtocolosPage>, nombre: string): number[] {
    const s = seccion(fixture, nombre);
    return Array.from(s?.querySelectorAll('[data-id]') ?? []).map((n) => Number(n.getAttribute('data-id')));
  }

  function tarjeta(fixture: ComponentFixture<MisProtocolosPage>, id: number): HTMLElement {
    const t = el(fixture).querySelector<HTMLElement>(`article[data-id="${id}"]`);
    if (!t) throw new Error(`No hay tarjeta para el protocolo ${id}`);
    return t;
  }

  function fila(fixture: ComponentFixture<MisProtocolosPage>, id: number): HTMLElement {
    const f = el(fixture).querySelector<HTMLElement>(`li[data-id="${id}"]`);
    if (!f) throw new Error(`No hay fila para el protocolo ${id}`);
    return f;
  }

  function botonPorTexto(raiz: HTMLElement, etiqueta: string): HTMLButtonElement | null {
    return (
      Array.from(raiz.querySelectorAll<HTMLButtonElement>('button')).find(
        (b) => texto(b) === etiqueta,
      ) ?? null
    );
  }

  // --- Cabecera ---

  it('cabecera: título, subtítulo en usted y Nuevo protocolo habilitado aunque haya un borrador', () => {
    const fixture = render();
    expect(texto(el(fixture).querySelector('h1'))).toBe(TXT_TITULO);
    expect(texto(el(fixture).querySelector('.mp-cabecera__subtitulo'))).toBe(TXT_SUBTITULO);
    const nuevo = Array.from(el(fixture).querySelectorAll('a')).find((a) => texto(a) === 'Nuevo protocolo');
    expect(nuevo?.getAttribute('href')).toBe('/dashboard/investigador/nuevo-protocolo');
    expect(nuevo?.hasAttribute('aria-disabled')).toBeFalse();
    expect(texto(el(fixture))).not.toContain('Ya tiene un borrador abierto');
    expect(texto(el(fixture))).not.toContain('Se elimina el');
  });

  // --- Secciones (D21) ---

  it('cada protocolo cae en su sección según receptionStatus, statusId y etapa', () => {
    const fixture = render();
    expect(texto(el(fixture).querySelector('#mp-h-accion'))).toBe(TXT_ACCION);
    expect(texto(el(fixture).querySelector('#mp-h-comite'))).toBe(TXT_COMITE);
    expect(texto(el(fixture).querySelector('#mp-h-archivados'))).toBe(TXT_ARCHIVADOS);
    // Necesita su acción: Borrador, Recepción completa, Con observaciones, Correcciones.
    expect(idsEn(fixture, 'accion')).toEqual([1, 2, 3, 4]);
    // En el comité: el orden del backend.
    expect(idsEn(fixture, 'comite')).toEqual([5, 6, 7, 9]);
    expect(idsEn(fixture, 'archivados')).toEqual([8]);
  });

  it('un COMPLETO con los tiempos ya aceptados al cargar va a En el comité (Asignación), no a Necesita su acción', () => {
    lista$ = of([
      protocolo(6, {
        estado: EstadoProtocolo.COMPLETO,
        isTimelineTermsAccepted: true,
        etapa: 'ASIGNACION',
      }),
    ]);
    const fixture = render();
    expect(seccion(fixture, 'accion')).toBeNull();
    expect(idsEn(fixture, 'comite')).toEqual([6]);
    expect(texto(fila(fixture, 6))).toContain('Asignación');
  });

  it('las secciones vacías no se muestran y Archivados solo aparece si hay alguno', () => {
    lista$ = of([protocolo(1, {})]);
    const fixture = render();
    expect(seccion(fixture, 'accion')).not.toBeNull();
    expect(seccion(fixture, 'comite')).toBeNull();
    expect(seccion(fixture, 'archivados')).toBeNull();
    expect(texto(el(fixture))).not.toContain(TXT_COMITE);
    expect(texto(el(fixture))).not.toContain(TXT_ARCHIVADOS);
  });

  // --- Tarjetas (D22) ---

  it('borrador: chip Borrador, N de M sin NO_APLICA y Continuar con su enlace (T09-4)', () => {
    const fixture = render();
    const t = tarjeta(fixture, 1);
    expect(texto(t.querySelector('app-status-chip'))).toBe('Borrador');
    expect(texto(t)).toContain(`2 de 4 documentos subidos · ${TXT_SIN_CODIGO}`);
    const continuar = t.querySelector('a[aria-label^="Continuar borrador"]');
    expect(continuar?.getAttribute('aria-label')).toBe(
      'Continuar borrador: Estudio de prueba numero 1 del investigador',
    );
    expect(continuar?.getAttribute('href')).toBe('/dashboard/investigador/nuevo-protocolo?borrador=1');
    expect(el(fixture).querySelectorAll('a[aria-label^="Continuar borrador"]').length).toBe(1);
  });

  it('borrador: singular con M = 1 y sin conteo si no hay checklist', () => {
    lista$ = of([
      protocolo(1, { checklist: [{ status: 'NO_PRESENTADO' }, { status: 'NO_APLICA' }] }),
      protocolo(2, { checklist: [] }),
    ]);
    const fixture = render();
    expect(texto(tarjeta(fixture, 1))).toContain(`0 de 1 documento subido · ${TXT_SIN_CODIGO}`);
    expect(texto(tarjeta(fixture, 2))).toContain('Sin código hasta que la Secretaría lo reciba');
    expect(texto(tarjeta(fixture, 2))).not.toContain(' de 0 ');
  });

  it('con observaciones: N de filas RECHAZADO, plazo en fecha de Ecuador y Ver y corregir', () => {
    const fixture = render();
    const t = tarjeta(fixture, 3);
    expect(texto(t)).toContain('Con observaciones');
    expect(texto(t)).toContain('Corrija hasta el 04/12/2026.');
    expect(texto(t)).toContain('La Secretaría observó 2 documentos.');
    expect(texto(t)).not.toContain('(30 días)');
    expect(t.querySelector('button[aria-label^="Ver y corregir"]')?.getAttribute('aria-label')).toBe(
      'Ver y corregir: Estudio de prueba numero 3 del investigador',
    );
  });

  it('con observaciones: singular con 1, N = 0 y sin plazo si la fecha no es válida', () => {
    lista$ = of([
      protocolo(3, {
        estado: 'INCOMPLETO' as EstadoProtocolo,
        checklist: [{ status: 'RECHAZADO' }, { status: 'PENDIENTE' }],
        submissionDeadline: 'no es una fecha',
      }),
      protocolo(10, {
        estado: 'INCOMPLETO' as EstadoProtocolo,
        checklist: [{ status: 'PENDIENTE' }, { status: 'NO_PRESENTADO' }],
      }),
    ]);
    const fixture = render();
    expect(texto(tarjeta(fixture, 3))).toContain('La Secretaría observó 1 documento.');
    expect(texto(tarjeta(fixture, 3))).not.toContain('Corrija hasta el');
    expect(texto(tarjeta(fixture, 10))).toContain('La Secretaría pidió completar la documentación.');
  });

  it('correcciones sin enviar: chip con el código, chip Correcciones sin enviar y Subir correcciones', () => {
    const fixture = render();
    const t = tarjeta(fixture, 4);
    const chips = Array.from(t.querySelectorAll('app-status-chip')).map((c) => texto(c));
    expect(chips).toEqual(['CEISH-PRUEBA-004', 'Correcciones sin enviar']);
    botonPorTexto(t, 'Subir correcciones')?.click();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/evaluacion-etica/subsanaciones'], {
      queryParams: { protocolId: 4 },
    });
  });

  // --- Aceptar los tiempos (D23) ---

  it('recepción completa: chips, textos sin fecha y Aceptar tiempos deshabilitado sin la casilla', () => {
    const fixture = render();
    const t = tarjeta(fixture, 2);
    const chips = Array.from(t.querySelectorAll('app-status-chip')).map((c) => texto(c));
    expect(chips).toEqual(['CEISH-PRUEBA-002', 'Recepción completa · acepte los tiempos']);
    expect(texto(t)).toContain(TXT_VEINTE_DIAS);
    expect(texto(t)).toContain(TXT_CONSTANCIA);
    expect(texto(t)).not.toContain('Ver constancia');
    expect(texto(t.querySelector('label'))).toBe(TXT_CASILLA);
    const boton = botonPorTexto(t, 'Aceptar tiempos');
    expect(boton?.disabled).toBeTrue();

    const casilla = t.querySelector<HTMLInputElement>('input[type="checkbox"]');
    casilla?.click();
    fixture.detectChanges();
    expect(botonPorTexto(t, 'Aceptar tiempos')?.disabled).toBeFalse();
  });

  it('aceptar: Enviando… y luego éxito en role="status" con la fecha en hora de Ecuador; la tarjeta se queda', () => {
    const respuesta$ = new Subject<unknown>();
    acceptTimeline.and.returnValue(respuesta$);
    const fixture = render();
    const t = tarjeta(fixture, 2);
    const estado = t.querySelector('[role="status"]');
    expect(estado).not.toBeNull();
    expect(texto(estado)).toBe('');

    t.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
    fixture.detectChanges();
    botonPorTexto(t, 'Aceptar tiempos')?.click();
    fixture.detectChanges();
    expect(acceptTimeline).toHaveBeenCalledOnceWith('2');
    expect(botonPorTexto(t, 'Enviando…')?.disabled).toBeTrue();
    expect(t.querySelector<HTMLInputElement>('input[type="checkbox"]')?.disabled).toBeTrue();

    // 03:30 UTC del 18/11 son las 22:30 del 17/11 en Ecuador.
    respuesta$.next({ data: { message: 'ok', timelineTermsAcceptedAt: '2026-11-18T03:30:00.000Z' } });
    respuesta$.complete();
    fixture.detectChanges();

    const despues = tarjeta(fixture, 2);
    expect(texto(despues.querySelector('[role="status"]'))).toBe(
      'Aceptó los tiempos el 17/11/2026. La Presidenta asignará a los pares evaluadores.',
    );
    expect(Array.from(despues.querySelectorAll('app-status-chip')).map((c) => texto(c))).toContain(
      'Tiempos aceptados',
    );
    expect(botonPorTexto(despues, 'Aceptar tiempos')).toBeNull();
    expect(despues.querySelector('input[type="checkbox"]')).toBeNull();
    expect(idsEn(fixture, 'accion')).toContain(2);
  });

  it('aceptar: el aceptado sigue en Necesita su acción si la lista se recarga por una notificación', () => {
    acceptTimeline.and.returnValue(of({ data: { timelineTermsAcceptedAt: '2026-11-17T15:00:00.000Z' } }));
    const fixture = render();
    const t = tarjeta(fixture, 2);
    t.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
    fixture.detectChanges();
    botonPorTexto(t, 'Aceptar tiempos')?.click();
    fixture.detectChanges();

    lista$ = of(
      listaCompleta().map((p) =>
        p.id === 2 ? { ...p, isTimelineTermsAccepted: true } : p,
      ),
    );
    broker$.next({});
    fixture.detectChanges();

    expect(idsEn(fixture, 'accion')).toContain(2);
    expect(texto(tarjeta(fixture, 2).querySelector('[role="status"]'))).toContain(
      'Aceptó los tiempos el 17/11/2026.',
    );
  });

  it('aceptar: si falla, el mensaje del backend en role="alert" y el botón vuelve a habilitarse', () => {
    const mensaje =
      'La documentación del protocolo debe estar en estado COMPLETO para poder aceptar el sometimiento a tiempos';
    acceptTimeline.and.returnValue(throwError(() => new Error(mensaje)));
    const fixture = render();
    const t = tarjeta(fixture, 2);
    t.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
    fixture.detectChanges();
    botonPorTexto(t, 'Aceptar tiempos')?.click();
    fixture.detectChanges();

    expect(texto(t.querySelector('[role="alert"]'))).toBe(mensaje);
    expect(botonPorTexto(t, 'Aceptar tiempos')?.disabled).toBeFalse();
    expect(texto(t.querySelector('[role="status"]'))).toBe('');
  });

  it('aceptar: sin mensaje del backend, el texto de respaldo de F10', () => {
    acceptTimeline.and.returnValue(throwError(() => ({})));
    const fixture = render();
    const t = tarjeta(fixture, 2);
    t.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
    fixture.detectChanges();
    botonPorTexto(t, 'Aceptar tiempos')?.click();
    fixture.detectChanges();
    expect(texto(t.querySelector('[role="alert"]'))).toBe(TXT_ERROR_ACEPTAR);
  });

  it('coinvestigador: sin casilla ni botón, con el aviso del investigador principal', () => {
    lista$ = of([
      protocolo(2, {
        estado: EstadoProtocolo.COMPLETO,
        codigoCeish: 'CEISH-PRUEBA-002',
        principalInvestigatorId: 99,
      }),
    ]);
    const fixture = render();
    const t = tarjeta(fixture, 2);
    expect(t.querySelector('input[type="checkbox"]')).toBeNull();
    expect(botonPorTexto(t, 'Aceptar tiempos')).toBeNull();
    expect(texto(t)).toContain(TXT_COINVESTIGADOR);
    expect(texto(t)).toContain(TXT_VEINTE_DIAS);
  });

  // --- En el comité y Archivados (D24) ---

  it('En el comité: línea y etapa de cada fila, con el código delante del título', () => {
    const fixture = render();
    expect(texto(fila(fixture, 5).querySelector('.mp-fila__linea'))).toBe(TXT_ESPERANDO);
    expect(texto(fila(fixture, 5).querySelector('.mp-fila__etapa'))).toBe('Etapa: Recepción');
    expect(texto(fila(fixture, 6).querySelector('.mp-fila__linea'))).toBe(TXT_PRESIDENTA);
    expect(texto(fila(fixture, 6).querySelector('.mp-fila__etapa'))).toBe('Etapa: Asignación');
    expect(texto(fila(fixture, 7).querySelector('.mp-fila__linea'))).toBe(TXT_PARES);
    expect(texto(fila(fixture, 7).querySelector('.mp-fila__etapa'))).toBe('Etapa: Evaluación');
    // Resolución: la etiqueta de estado que ya existe (APROBADO, 17).
    expect(texto(fila(fixture, 9).querySelector('.mp-fila__linea'))).toBe('Aprobado');
    expect(texto(fila(fixture, 9).querySelector('.mp-fila__etapa'))).toBe('Etapa: Resolución');
    expect(texto(fila(fixture, 7).querySelector('a'))).toBe(
      'CEISH-PRUEBA-007 · Estudio de prueba numero 7 del investigador',
    );
    expect(texto(fila(fixture, 5).querySelector('a'))).toBe('Estudio de prueba numero 5 del investigador');
    expect(texto(el(fixture))).not.toContain('Enviado el');
  });

  it('Archivados: fila con la etiqueta que ya existe', () => {
    const fixture = render();
    expect(texto(fila(fixture, 8).querySelector('.mp-fila__linea'))).toBe('Archivado por Vencimiento');
  });

  // --- Enlaces y lo que se quita (D25) ---

  it('el título de cada protocolo enlaza al espacio del protocolo', () => {
    const fixture = render();
    for (const id of [1, 2, 3, 4]) {
      expect(tarjeta(fixture, id).querySelector('h3 a')?.getAttribute('href')).toBe(
        `/dashboard/protocols/workspace/${id}/info`,
      );
    }
    for (const id of [5, 6, 7, 8, 9]) {
      expect(fila(fixture, id).querySelector('a')?.getAttribute('href')).toBe(
        `/dashboard/protocols/workspace/${id}/info`,
      );
    }
  });

  it('sin Gestionar, sin menú ⋮ y sin la tarjeta que pulsa', () => {
    const fixture = render();
    const todo = texto(el(fixture));
    expect(todo).not.toContain('Gestionar');
    expect(todo).not.toContain('Pendiente Aceptación de Tiempos');
    expect(todo).not.toContain('Solicitar Enmienda');
    expect(todo).not.toContain('Descargar Acta');
    expect(el(fixture).querySelector('mat-menu, [mat-icon-button], .animate-pulse-amber')).toBeNull();
  });

  it('ningún texto trata de tú', () => {
    // Principal y coinvestigador para ver los dos textos de la aceptación.
    lista$ = of([
      ...listaCompleta(),
      protocolo(11, { estado: EstadoProtocolo.COMPLETO, principalInvestigatorId: 99 }),
    ]);
    const fixture = render();
    const todo = texto(el(fixture));
    // Palabras sueltas en tú y las frases en tú del canvas.
    const tuteo = /(^|[^\p{L}])(ti|tú|tu|tus|tienes|tuyo|envíalo|descártalo|aceptaste|corrige)(?![\p{L}])/iu;
    expect(todo.match(tuteo)).toBeNull();
    for (const frase of ['completa · acepta los tiempos', 'Tienes hasta', 'si no lo envías', 'Ya tienes']) {
      expect(todo).not.toContain(frase);
    }
  });

  // --- Ver y corregir con T09-6 (D26) ---

  it('Ver y corregir: INCOMPLETO de versión 1 → validación; versión mayor que 1 → subsanación', () => {
    lista$ = of([
      protocolo(3, { estado: 'INCOMPLETO' as EstadoProtocolo, versionNumber: 1 }),
      protocolo(12, { estado: 'INCOMPLETO' as EstadoProtocolo, versionNumber: 2 }),
    ]);
    const fixture = render();
    botonPorTexto(tarjeta(fixture, 3), 'Ver y corregir')?.click();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/protocols/workspace', 3, 'validation']);
    botonPorTexto(tarjeta(fixture, 12), 'Ver y corregir')?.click();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/evaluacion-etica/subsanaciones'], {
      queryParams: { protocolId: 12 },
    });
  });

  // --- Estados de la página (D25) ---

  it('mientras carga: LoadingState', () => {
    lista$ = NEVER;
    const fixture = render();
    expect(texto(el(fixture).querySelector('app-loading-state'))).toBe(TXT_CARGANDO);
  });

  it('si la lista falla: ErrorState con Reintentar, que vuelve a pedirla', () => {
    lista$ = throwError(() => new Error('fallo de prueba'));
    const fixture = render();
    const error = el(fixture).querySelector('app-error-state');
    expect(texto(error?.querySelector('.state__message') ?? null)).toBe(TXT_ERROR_LISTA);
    expect(obtenerMisProtocolos).toHaveBeenCalledTimes(1);

    lista$ = of([protocolo(1, {})]);
    botonPorTexto(el(fixture), 'Reintentar')?.click();
    fixture.detectChanges();
    expect(obtenerMisProtocolos).toHaveBeenCalledTimes(2);
    expect(el(fixture).querySelector('app-error-state')).toBeNull();
    expect(idsEn(fixture, 'accion')).toEqual([1]);
  });

  it('si falla una recarga por notificación con la lista en pantalla, la lista se conserva', () => {
    const fixture = render();
    marcarCasilla(fixture, 2);
    lista$ = throwError(() => new Error('fallo de prueba'));
    broker$.next({});
    fixture.detectChanges();
    expect(el(fixture).querySelector('app-error-state')).toBeNull();
    expect(idsEn(fixture, 'accion')).toEqual([1, 2, 3, 4]);
    expect(tarjeta(fixture, 2).querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).toBeTrue();
  });

  function marcarCasilla(fixture: ComponentFixture<MisProtocolosPage>, id: number): void {
    tarjeta(fixture, id).querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
    fixture.detectChanges();
  }

  it('con la lista vacía: EmptyState y sin secciones', () => {
    lista$ = of([]);
    const fixture = render();
    expect(texto(el(fixture).querySelector('app-empty-state'))).toBe(TXT_VACIO);
    expect(el(fixture).querySelector('[data-seccion]')).toBeNull();
  });
});
