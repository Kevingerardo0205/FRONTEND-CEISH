import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, Subject, defer, of, throwError, EMPTY } from 'rxjs';

import { TemplateManagementPage } from './template-management.page';
import { LoadTemplatesUseCase } from '@features/documents/application/use-cases/load-templates.use-case';
import { CreateTemplateUseCase } from '@features/documents/application/use-cases/create-template.use-case';
import { UploadTemplateFileUseCase } from '@features/documents/application/use-cases/upload-template-file.use-case';
import { IDocumentRepositoryPort, Template } from '@domain/ports/IDocumentRepositoryPort';

describe('TemplateManagementPage — Formatos (F08 CF1)', () => {
  const URL_BUENA = 'https://zz-test.invalid/formatos/zz-test.docx';
  const CON_ARCHIVO: Template = {
    id: 1,
    code: 'ZZ_TEST_CON',
    name: 'Formato de prueba con archivo',
    filePath: 'templates/zz_test_con_template.docx',
    isActive: true,
  };
  const SIN_ARCHIVO: Template = {
    id: 2,
    code: 'ZZ_TEST_SIN',
    name: 'Formato de prueba sin archivo',
    filePath: null as unknown as string,
    isActive: true,
  };

  let fixture: ComponentFixture<TemplateManagementPage>;
  let el: HTMLElement;
  let load: jasmine.Spy;
  let create: jasmine.Spy;
  let upload: jasmine.Spy;
  let downloadTemplate: jasmine.Spy;
  let orden: string[];
  let pestana: { opener: unknown; location: { href: string }; close: jasmine.Spy };
  let abrirSpy: jasmine.Spy;

  async function crear(lista: Observable<Template[]> = of([CON_ARCHIVO, SIN_ARCHIVO])) {
    load = jasmine.createSpy('load').and.returnValue(lista);
    create = jasmine.createSpy('create').and.returnValue(of({}));
    upload = jasmine.createSpy('upload').and.returnValue(of({}));
    downloadTemplate = jasmine.createSpy('downloadTemplate').and.callFake(() =>
      defer(() => {
        orden.push('pedir');
        return of({ downloadUrl: URL_BUENA });
      }),
    );
    await TestBed.configureTestingModule({
      imports: [TemplateManagementPage],
      providers: [
        provideRouter([]),
        { provide: LoadTemplatesUseCase, useValue: { execute: load } },
        { provide: CreateTemplateUseCase, useValue: { execute: create } },
        { provide: UploadTemplateFileUseCase, useValue: { execute: upload } },
        { provide: IDocumentRepositoryPort, useValue: { downloadTemplate } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateManagementPage);
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  beforeEach(() => {
    orden = [];
    pestana = { opener: {}, location: { href: '' }, close: jasmine.createSpy('close') };
    abrirSpy = spyOn(window, 'open').and.callFake(() => {
      orden.push('abrir');
      return pestana as unknown as Window;
    });
  });

  const fila = (codigo: string) => el.querySelector(`tr[data-codigo="${codigo}"]`) as HTMLElement;
  const texto = (e: Element | null) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const botones = (raiz: Element) => Array.from(raiz.querySelectorAll('button'));
  const boton = (raiz: Element, txt: string) =>
    botones(raiz).find((b) => texto(b) === txt) as HTMLButtonElement;

  function elegirArchivo(input: HTMLInputElement, nombre: string): File {
    const archivo = new File(['zz'], nombre);
    const dt = new DataTransfer();
    dt.items.add(archivo);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    return archivo;
  }

  const inputDeFila = (codigo: string) =>
    fila(codigo).querySelector('input[type="file"]') as HTMLInputElement;

  function escribir(id: string, valor: string): void {
    const input = el.querySelector(`#${id}`) as HTMLInputElement;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function abrirFormulario(): void {
    boton(el, 'Nuevo formato').click();
    fixture.detectChanges();
  }

  function guardar(): void {
    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  describe('encabezado y secciones (D2, D3)', () => {
    beforeEach(() => crear());

    it('muestra Formatos con su subtítulo y el ButtonGroup Usuarios · Formatos', () => {
      expect(texto(el.querySelector('h1'))).toBe('Formatos');
      expect(el.textContent).toContain(
        'Documentos que el investigador descarga desde su lista de requisitos.',
      );
      const grupo = el.querySelector('[aria-label="Secciones de Configuración"]') as HTMLElement;
      expect(grupo).not.toBeNull();
      expect(boton(grupo, 'Formatos').getAttribute('aria-pressed')).toBe('true');
      expect(boton(grupo, 'Usuarios').getAttribute('aria-pressed')).toBe('false');
    });

    it('Usuarios navega a /configuracion/usuarios', () => {
      const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      const grupo = el.querySelector('[aria-label="Secciones de Configuración"]') as HTMLElement;
      boton(grupo, 'Usuarios').click();
      expect(navegar).toHaveBeenCalledOnceWith(['/configuracion', 'usuarios']);
    });

    it('si la navegación no se completa, Formatos vuelve a quedar marcado', async () => {
      spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(false);
      const grupo = el.querySelector('[aria-label="Secciones de Configuración"]') as HTMLElement;
      boton(grupo, 'Usuarios').click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(boton(grupo, 'Formatos').getAttribute('aria-pressed')).toBe('true');
      expect(boton(grupo, 'Usuarios').getAttribute('aria-pressed')).toBe('false');
    });

    it('el aviso role="status" existe siempre, sin display: none, y vacío no ocupa lugar', () => {
      const aviso = el.querySelector('.fmt-aviso') as HTMLElement;
      expect(aviso.getAttribute('role')).toBe('status');
      expect(aviso.textContent).toBe('');
      const estilo = getComputedStyle(aviso);
      expect(estilo.display).not.toBe('none');
      expect(estilo.paddingTop).toBe('0px');
      expect(estilo.borderTopWidth).toBe('0px');
      expect(aviso.getBoundingClientRect().height).toBe(0);
      // El espacio de la grilla se descuenta: la sección siguiente queda donde estaría sin el aviso.
      const anterior = aviso.previousElementSibling as HTMLElement;
      const siguiente = aviso.nextElementSibling as HTMLElement;
      const gap = parseFloat(getComputedStyle(el.querySelector('.fmt') as HTMLElement).rowGap);
      expect(
        siguiente.getBoundingClientRect().top - anterior.getBoundingClientRect().bottom,
      ).toBeCloseTo(gap, 0);
    });

    it('no trae lo que se quitó (D8): tarjetas de números, buscador, Cloudflare ni estilos en línea', () => {
      expect(el.querySelector('input[type="search"], input[placeholder]')).toBeNull();
      expect(el.textContent).not.toMatch(/Cloudflare|R2/);
      expect(el.querySelector('[style]')).toBeNull();
      expect(el.querySelector('.card, .row, .col, .btn')).toBeNull();
    });
  });

  describe('lista (D4)', () => {
    it('columnas, chips Con archivo / Sin archivo y sin la ruta interna', async () => {
      await crear();
      const encabezados = Array.from(el.querySelectorAll('th')).map(texto);
      expect(encabezados).toEqual(['Código', 'Nombre', 'Archivo', 'Acciones']);
      expect(texto(fila('ZZ_TEST_CON'))).toContain('Con archivo');
      expect(texto(fila('ZZ_TEST_SIN'))).toContain('Sin archivo');
      expect(el.textContent).not.toContain('templates/zz_test_con_template.docx');
      expect(boton(fila('ZZ_TEST_CON'), 'Cambiar archivo').getAttribute('aria-label')).toBe(
        'Cambiar archivo de Formato de prueba con archivo',
      );
      expect(boton(fila('ZZ_TEST_SIN'), 'Subir archivo').getAttribute('aria-label')).toBe(
        'Subir archivo de Formato de prueba sin archivo',
      );
      // Descargar solo con archivo.
      expect(boton(fila('ZZ_TEST_CON'), 'Descargar')).toBeDefined();
      expect(boton(fila('ZZ_TEST_SIN'), 'Descargar')).toBeUndefined();
    });

    it('cargando: LoadingState con su texto', async () => {
      await crear(new Subject<Template[]>());
      expect(el.textContent).toContain('Cargando los formatos…');
    });

    it('vacía: EmptyState Todavía no hay formatos.', async () => {
      await crear(of([]));
      expect(el.textContent).toContain('Todavía no hay formatos.');
      expect(el.querySelector('table')).toBeNull();
    });

    it('error: ErrorState con Reintentar que vuelve a pedir la lista', async () => {
      await crear(throwError(() => ({ status: 500 })));
      expect(el.textContent).toContain('No pudimos cargar los formatos.');
      load.and.returnValue(of([CON_ARCHIVO]));
      boton(el, 'Reintentar').click();
      fixture.detectChanges();
      expect(load).toHaveBeenCalledTimes(2);
      expect(fila('ZZ_TEST_CON')).not.toBeNull();
    });
  });

  describe('subir o cambiar el archivo (D5, F08-3)', () => {
    beforeEach(() => crear());

    it('un archivo que no es .docx no hace ninguna petición y muestra el error unido al botón', () => {
      elegirArchivo(inputDeFila('ZZ_TEST_SIN'), 'zz-test.pdf');
      expect(upload).not.toHaveBeenCalled();
      const alerta = fila('ZZ_TEST_SIN').querySelector('[role="alert"]') as HTMLElement;
      expect(texto(alerta)).toBe('El archivo debe estar en formato Word (.docx).');
      expect(boton(fila('ZZ_TEST_SIN'), 'Subir archivo').getAttribute('aria-describedby')).toBe(
        alerta.id,
      );
    });

    it('.DOCX en mayúsculas se acepta; al subir muestra el aviso y vuelve a pedir la lista', () => {
      const archivo = elegirArchivo(inputDeFila('ZZ_TEST_SIN'), 'ZZ-TEST.DOCX');
      expect(upload).toHaveBeenCalledOnceWith('ZZ_TEST_SIN', archivo);
      expect(texto(el.querySelector('[role="status"]'))).toBe(
        'Archivo de Formato de prueba sin archivo actualizado.',
      );
      expect(load).toHaveBeenCalledTimes(2);
    });

    it('si la recarga falla después de subir, la fila ya muestra Con archivo y Descargar', () => {
      load.and.returnValue(throwError(() => ({ status: 500 })));
      elegirArchivo(inputDeFila('ZZ_TEST_SIN'), 'zz-test.docx');
      expect(texto(fila('ZZ_TEST_SIN'))).toContain('Con archivo');
      expect(boton(fila('ZZ_TEST_SIN'), 'Descargar')).toBeDefined();
      expect(el.textContent).not.toContain('No pudimos cargar los formatos.');
    });

    it('Subiendo… deshabilitado mientras sube', () => {
      upload.and.returnValue(new Subject());
      elegirArchivo(inputDeFila('ZZ_TEST_SIN'), 'zz-test.docx');
      const b = boton(fila('ZZ_TEST_SIN'), 'Subiendo…');
      expect(b.disabled).toBeTrue();
    });

    it('si falla o termina sin respuesta: No pudimos subir el archivo.', () => {
      for (const respuesta of [throwError(() => ({ status: 500 })), EMPTY]) {
        upload.and.returnValue(respuesta);
        elegirArchivo(inputDeFila('ZZ_TEST_SIN'), 'zz-test.docx');
        expect(texto(fila('ZZ_TEST_SIN').querySelector('[role="alert"]'))).toBe(
          'No pudimos subir el archivo. Intente de nuevo.',
        );
        expect(texto(el.querySelector('[role="status"]'))).toBe('');
      }
    });
  });

  describe('descargar con la función compartida (D6, F08-4)', () => {
    beforeEach(() => crear());

    it('abre la pestaña en el clic antes de pedir la URL, sin opener, y la lleva a la URL', () => {
      boton(fila('ZZ_TEST_CON'), 'Descargar').click();
      fixture.detectChanges();
      expect(orden).toEqual(['abrir', 'pedir']);
      expect(abrirSpy).toHaveBeenCalledOnceWith('', '_blank');
      expect(downloadTemplate).toHaveBeenCalledOnceWith('ZZ_TEST_CON');
      expect(pestana.opener).toBeNull();
      expect(pestana.location.href).toBe(URL_BUENA);
      expect(fila('ZZ_TEST_CON').querySelector('[role="alert"]')).toBeNull();
    });

    it('Descargando… deshabilitado mientras espera', () => {
      downloadTemplate.and.returnValue(new Subject());
      boton(fila('ZZ_TEST_CON'), 'Descargar').click();
      fixture.detectChanges();
      expect(boton(fila('ZZ_TEST_CON'), 'Descargando…').disabled).toBeTrue();
    });

    it('404: Este formato no está disponible. y la pestaña se cierra', () => {
      downloadTemplate.and.returnValue(throwError(() => ({ status: 404 })));
      boton(fila('ZZ_TEST_CON'), 'Descargar').click();
      fixture.detectChanges();
      expect(pestana.close).toHaveBeenCalledTimes(1);
      expect(texto(fila('ZZ_TEST_CON').querySelector('[role="alert"]'))).toBe(
        'Este formato no está disponible.',
      );
    });

    it('URL que no es https: no navega, cierra la pestaña y muestra el error genérico', () => {
      downloadTemplate.and.returnValue(of({ downloadUrl: 'http://zz-test.invalid/zz.docx' }));
      boton(fila('ZZ_TEST_CON'), 'Descargar').click();
      fixture.detectChanges();
      expect(pestana.location.href).toBe('');
      expect(pestana.close).toHaveBeenCalledTimes(1);
      expect(texto(fila('ZZ_TEST_CON').querySelector('[role="alert"]'))).toBe(
        'No pudimos descargar el formato. Intente de nuevo.',
      );
    });

    it('sin pestaña (bloqueada): error genérico y no se pide la URL', () => {
      abrirSpy.and.returnValue(null);
      boton(fila('ZZ_TEST_CON'), 'Descargar').click();
      fixture.detectChanges();
      expect(downloadTemplate).not.toHaveBeenCalled();
      expect(texto(fila('ZZ_TEST_CON').querySelector('[role="alert"]'))).toBe(
        'No pudimos descargar el formato. Intente de nuevo.',
      );
    });
  });

  describe('nuevo formato (D7, F08-5)', () => {
    beforeEach(() => crear());

    it('Nuevo formato abre el formulario debajo, sin modal, con aria-expanded', () => {
      const b = boton(el, 'Nuevo formato');
      expect(b.getAttribute('aria-expanded')).toBe('false');
      abrirFormulario();
      expect(b.getAttribute('aria-expanded')).toBe('true');
      expect(el.querySelector('form#fmt-formulario')).not.toBeNull();
      expect(el.querySelector('[role="dialog"]')).toBeNull();
      expect(el.textContent).toContain('Solo mayúsculas, números y guion bajo (_).');
    });

    it('un código que ya está en la lista no llama al backend', () => {
      abrirFormulario();
      escribir('fmt-codigo', 'zz_test_con');
      escribir('fmt-nombre', 'Otro nombre');
      guardar();
      expect(create).not.toHaveBeenCalled();
      expect(upload).not.toHaveBeenCalled();
      expect(texto(el.querySelector('#fmt-formulario-error'))).toBe(
        'Ya existe un formato con el código ZZ_TEST_CON.',
      );
    });

    it('campos vacíos o código con otros caracteres: errores y ninguna petición', () => {
      abrirFormulario();
      escribir('fmt-nombre', '   ');
      guardar();
      expect(el.textContent).toContain('El código es obligatorio.');
      expect(el.textContent).toContain('El nombre es obligatorio.');
      escribir('fmt-codigo', 'ZZ-TEST');
      expect(el.textContent).toContain('Solo mayúsculas, números y guion bajo (_).');
      guardar();
      expect(create).not.toHaveBeenCalled();
    });

    it('el código se pasa a mayúsculas; sin archivo solo crea los metadatos', () => {
      abrirFormulario();
      escribir('fmt-codigo', 'zz_test_nuevo');
      expect((el.querySelector('#fmt-codigo') as HTMLInputElement).value).toBe('ZZ_TEST_NUEVO');
      escribir('fmt-nombre', ' Formato nuevo de prueba ');
      guardar();
      expect(create).toHaveBeenCalledOnceWith({ code: 'ZZ_TEST_NUEVO', name: 'Formato nuevo de prueba' });
      expect(upload).not.toHaveBeenCalled();
      expect(texto(el.querySelector('[role="status"]'))).toBe('Formato Formato nuevo de prueba guardado.');
      expect(el.querySelector('form')).toBeNull();
      expect(load).toHaveBeenCalledTimes(2);
    });

    it('el id del error de cada campo se suma a su aria-describedby', () => {
      abrirFormulario();
      const describe = (id: string) =>
        (el.querySelector(`#${id}`) as HTMLElement).getAttribute('aria-describedby') ?? '';
      expect(describe('fmt-codigo').split(' ')).toEqual(['fmt-codigo-ayuda']);
      expect(describe('fmt-nombre')).toBe('');
      guardar();
      expect(describe('fmt-codigo').split(' ')).toEqual(['fmt-codigo-ayuda', 'fmt-codigo-error']);
      expect(describe('fmt-nombre')).toBe('fmt-nombre-error');
      elegirArchivo(el.querySelector('#fmt-archivo') as HTMLInputElement, 'zz.doc');
      expect(describe('fmt-archivo')).toBe('fmt-archivo-error');
      for (const id of ['fmt-codigo-error', 'fmt-nombre-error', 'fmt-archivo-error']) {
        expect(el.querySelector(`#${id}`)).withContext(id).not.toBeNull();
      }
    });

    it('el cursor no salta al final al pasar a mayúsculas', () => {
      abrirFormulario();
      const input = el.querySelector('#fmt-codigo') as HTMLInputElement;
      input.value = 'ZZ_TEST';
      input.dispatchEvent(new Event('input'));
      input.value = 'ZZ_xTEST';
      input.setSelectionRange(4, 4);
      input.dispatchEvent(new Event('input'));
      expect(input.value).toBe('ZZ_XTEST');
      expect(input.selectionStart).toBe(4);
    });

    it('si la recarga falla después de crear, el formato nuevo ya está en la lista', () => {
      load.and.returnValue(throwError(() => ({ status: 500 })));
      abrirFormulario();
      escribir('fmt-codigo', 'ZZ_TEST_NUEVO');
      escribir('fmt-nombre', 'Formato nuevo de prueba');
      guardar();
      expect(texto(fila('ZZ_TEST_NUEVO'))).toContain('Sin archivo');
    });

    it('con archivo: crea y después sube el archivo con el mismo código', () => {
      abrirFormulario();
      escribir('fmt-codigo', 'ZZ_TEST_NUEVO');
      escribir('fmt-nombre', 'Formato nuevo de prueba');
      const archivo = elegirArchivo(el.querySelector('#fmt-archivo') as HTMLInputElement, 'zz.docx');
      const pasos: string[] = [];
      create.and.callFake(() => defer(() => (pasos.push('crear'), of({}))));
      upload.and.callFake(() => defer(() => (pasos.push('subir'), of({}))));
      guardar();
      expect(pasos).toEqual(['crear', 'subir']);
      expect(create).toHaveBeenCalledOnceWith({ code: 'ZZ_TEST_NUEVO', name: 'Formato nuevo de prueba' });
      expect(upload).toHaveBeenCalledOnceWith('ZZ_TEST_NUEVO', archivo);
    });

    it('archivo que no es .docx en el formulario: error y no guarda', () => {
      abrirFormulario();
      escribir('fmt-codigo', 'ZZ_TEST_NUEVO');
      escribir('fmt-nombre', 'Formato nuevo de prueba');
      elegirArchivo(el.querySelector('#fmt-archivo') as HTMLInputElement, 'zz.doc');
      expect(texto(el.querySelector('#fmt-archivo-error'))).toBe(
        'El archivo debe estar en formato Word (.docx).',
      );
      guardar();
      expect(create).not.toHaveBeenCalled();
    });

    it('si falla crear: No pudimos guardar el formato. y el formulario queda abierto', () => {
      create.and.returnValue(throwError(() => ({ status: 500 })));
      abrirFormulario();
      escribir('fmt-codigo', 'ZZ_TEST_NUEVO');
      escribir('fmt-nombre', 'Formato nuevo de prueba');
      guardar();
      expect(texto(el.querySelector('#fmt-formulario-error'))).toBe(
        'No pudimos guardar el formato. Intente de nuevo.',
      );
      expect(el.querySelector('form')).not.toBeNull();
    });

    it('creado pero falla la subida: lo dice y pide subirlo desde la lista', () => {
      upload.and.returnValue(throwError(() => ({ status: 500 })));
      abrirFormulario();
      escribir('fmt-codigo', 'ZZ_TEST_NUEVO');
      escribir('fmt-nombre', 'Formato nuevo de prueba');
      elegirArchivo(el.querySelector('#fmt-archivo') as HTMLInputElement, 'zz.docx');
      guardar();
      expect(texto(el.querySelector('[role="status"]'))).toBe(
        'Guardamos el formato Formato nuevo de prueba, pero no pudimos subir el archivo. Súbalo desde la lista.',
      );
    });

    it('Cancelar cierra y vacía el formulario', () => {
      abrirFormulario();
      escribir('fmt-codigo', 'ZZ_TEST_NUEVO');
      boton(el, 'Cancelar').click();
      fixture.detectChanges();
      expect(el.querySelector('form')).toBeNull();
      abrirFormulario();
      expect((el.querySelector('#fmt-codigo') as HTMLInputElement).value).toBe('');
    });
  });
});
