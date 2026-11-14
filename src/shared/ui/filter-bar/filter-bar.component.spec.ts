import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterBarComponent, FilterState } from './filter-bar.component';

@Component({
  standalone: true,
  imports: [FilterBarComponent],
  template: `
    <app-filter-bar
      #bar
      [viewKey]="viewKey()"
      placeholder="Código o título"
      (changed)="last = $event"
    >
      <select
        class="etapa"
        [value]="bar.filter('etapa')"
        (change)="bar.setFilter('etapa', $any($event.target).value)"
      >
        <option value="">Todas</option>
        <option value="EVALUACION">Evaluación</option>
      </select>
    </app-filter-bar>
  `,
})
class HostComponent {
  readonly viewKey = signal('protocolos-' + Math.random());
  readonly bar = viewChild.required(FilterBarComponent);
  last: FilterState | null = null;
}

describe('FilterBarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;
  const search = () => el.querySelector('input[type="search"]') as HTMLInputElement;

  function typeSearch(value: string): void {
    search().value = value;
    search().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('muestra la búsqueda con etiqueta accesible y proyecta los filtros', () => {
    const label = el.querySelector(`label[for="${search().id}"]`);

    expect(label?.textContent).toContain('Buscar');
    expect(search().placeholder).toBe('Código o título');
    expect(el.querySelector('[role="search"] select.etapa')).not.toBeNull();
  });

  it('emite el estado al buscar y al cambiar un filtro', () => {
    typeSearch('CEISH-001');
    host.bar().setFilter('etapa', 'EVALUACION');

    expect(host.last).toEqual({ search: 'CEISH-001', filters: { etapa: 'EVALUACION' } });
    expect(host.bar().filter('etapa')).toBe('EVALUACION');
  });

  it('quitar un filtro (valor vacío o null) lo elimina del estado', () => {
    host.bar().setFilter('etapa', 'EVALUACION');
    host.bar().setFilter('etapa', '');
    expect(host.bar().state().filters).toEqual({});

    host.bar().setFilter('tipo', 'X');
    host.bar().setFilter('tipo', null);
    expect(host.bar().state().filters).toEqual({});
  });

  it('recuerda los valores de cada vista al cambiar de vista', () => {
    const first = host.viewKey();
    typeSearch('tesis');
    host.bar().setFilter('etapa', 'EVALUACION');

    host.viewKey.set(first + '-otra');
    fixture.detectChanges();
    expect(search().value).toBe('');
    expect(host.bar().state()).toEqual({ search: '', filters: {} });

    host.viewKey.set(first);
    fixture.detectChanges();
    expect(search().value).toBe('tesis');
    expect(host.bar().filter('etapa')).toBe('EVALUACION');
  });

  it('una nueva instancia con la misma vista recupera los valores', () => {
    const key = host.viewKey();
    typeSearch('renovación');

    const second = TestBed.createComponent(HostComponent);
    second.componentInstance.viewKey.set(key);
    second.detectChanges();

    expect(second.componentInstance.bar().state().search).toBe('renovación');
  });

  it('clear() vacía la vista actual', () => {
    typeSearch('algo');
    host.bar().clear();
    fixture.detectChanges();

    expect(search().value).toBe('');
    expect(host.last).toEqual({ search: '', filters: {} });
  });

  it('sin maxLength, la búsqueda no lleva maxlength (F01 T01-7)', () => {
    expect(search().hasAttribute('maxlength')).toBeFalse();
  });

  it('maxLength pone el atributo maxlength (F01 T01-7)', () => {
    const conMax = TestBed.createComponent(FilterBarComponent);
    conMax.componentRef.setInput('viewKey', 'max-' + Math.random());
    conMax.componentRef.setInput('maxLength', 100);
    conMax.detectChanges();
    const input = (conMax.nativeElement as HTMLElement).querySelector('input[type="search"]');
    expect(input?.getAttribute('maxlength')).toBe('100');
  });

  it('reset() pone el estado sin emitir changed y lo recuerda (F01 T01-7)', () => {
    host.bar().reset({ search: 'desde la URL', filters: {} });
    fixture.detectChanges();

    expect(search().value).toBe('desde la URL');
    expect(host.last).toBeNull();
    const second = TestBed.createComponent(HostComponent);
    second.componentInstance.viewKey.set(host.viewKey());
    second.detectChanges();
    expect(second.componentInstance.bar().state().search).toBe('desde la URL');
  });
});
