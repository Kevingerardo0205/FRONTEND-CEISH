import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTableColumn, DataTableComponent } from './data-table.component';

interface Row {
  codigo: string;
  titulo: string;
  estado: string;
}

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent<Row>>;
  let el: HTMLElement;

  const columns: DataTableColumn<Row>[] = [
    { key: 'codigo', header: 'Código', value: (r) => r.codigo },
    { key: 'titulo', header: 'Título', value: (r) => r.titulo },
    {
      key: 'estado',
      header: 'Estado',
      value: (r) => r.estado,
      tone: (r) => (r.estado === 'Aprobado' ? 'verde' : 'ambar'),
    },
  ];
  const rows: Row[] = [
    { codigo: 'CEISH-001', titulo: 'Estudio A', estado: 'Aprobado' },
    { codigo: 'CEISH-002', titulo: 'Estudio B', estado: 'Observado' },
  ];

  function render(inputs: Partial<Record<string, unknown>>): void {
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', rows);
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DataTableComponent] });
    fixture = TestBed.createComponent(DataTableComponent<Row>);
  });

  it('muestra encabezados y filas según las columnas configuradas', () => {
    render({ caption: 'Protocolos' });

    expect(Array.from(el.querySelectorAll('th')).map((th) => th.textContent?.trim())).toEqual([
      'Código',
      'Título',
      'Estado',
    ]);
    expect(el.querySelectorAll('tbody tr').length).toBe(2);
    expect(el.querySelector('caption')?.textContent).toContain('Protocolos');
  });

  it('la columna con tono se muestra como StatusChip con texto', () => {
    render({});
    const chips = el.querySelectorAll('app-status-chip .chip');

    expect(chips.length).toBe(2);
    expect(chips[0].classList).toContain('chip--verde');
    expect(chips[0].textContent?.trim()).toBe('Aprobado');
    expect(chips[1].classList).toContain('chip--ambar');
  });

  it('las filas son clicables con ratón y con Enter', () => {
    render({});
    const clicked: Row[] = [];
    fixture.componentInstance.rowClick.subscribe((r) => clicked.push(r));
    const trs = el.querySelectorAll<HTMLTableRowElement>('tbody tr');

    trs[0].click();
    trs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(clicked).toEqual(rows);
    expect(trs[0].getAttribute('tabindex')).toBe('0');
  });

  it('la tabla va dentro de un contenedor con desplazamiento horizontal', () => {
    render({});
    const scroll = el.querySelector('.data-table__scroll') as HTMLElement;

    expect(scroll.contains(el.querySelector('table'))).toBeTrue();
    expect(getComputedStyle(scroll).overflowX).toBe('auto');
  });

  describe('criterio 6: estados vacío, cargando y error', () => {
    it('vacío: muestra el mensaje y no la tabla', () => {
      render({ rows: [], emptyMessage: 'No hay protocolos en esta etapa.' });

      expect(el.querySelector('table')).toBeNull();
      expect(el.querySelector('app-empty-state')?.textContent).toContain(
        'No hay protocolos en esta etapa.',
      );
    });

    it('cargando: muestra el estado de carga aunque haya filas', () => {
      render({ loading: true });

      expect(el.querySelector('table')).toBeNull();
      expect(el.querySelector('app-loading-state [role="status"]')).not.toBeNull();
    });

    it('cargando sin filas muestra el estado cargando y no el vacío', () => {
      render({ loading: true, rows: [] });

      expect(el.querySelector('app-loading-state')).not.toBeNull();
      expect(el.querySelector('app-empty-state')).toBeNull();
    });

    it('cargando con error muestra cargando', () => {
      render({ loading: true, error: 'No pudimos cargar los protocolos.' });

      expect(el.querySelector('app-loading-state')).not.toBeNull();
      expect(el.querySelector('app-error-state')).toBeNull();
    });

    it('error: muestra el mensaje y permite reintentar', () => {
      render({ error: 'No pudimos cargar los protocolos.' });
      const retry = jasmine.createSpy('retry');
      fixture.componentInstance.retry.subscribe(retry);

      expect(el.querySelector('table')).toBeNull();
      expect(el.querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos cargar los protocolos.',
      );
      (el.querySelector('app-error-state button') as HTMLButtonElement).click();
      expect(retry).toHaveBeenCalledTimes(1);
    });

    it('cada estado mantiene el mismo contenedor de la tabla', () => {
      for (const inputs of [{ loading: true }, { error: 'x' }, { rows: [] }, {}]) {
        fixture.componentRef.setInput('loading', false);
        fixture.componentRef.setInput('error', null);
        render(inputs);
        expect(el.querySelectorAll(':scope > .data-table').length).toBe(1);
      }
    });
  });
});
