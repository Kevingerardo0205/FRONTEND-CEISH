import { TestBed } from '@angular/core/testing';
import { Stage } from '@domain/value-objects/stage.vo';
import { ProtocolListItem } from '../../../domain/protocol-list-item.model';
import { ProtocolosTableComponent } from './protocolos-table.component';

const ITEM: ProtocolListItem = {
  id: 1,
  ceishCode: 'IO-001-2026',
  title: 'Estudio de prueba A',
  etapa: Stage.fromBackend('EVALUACION'),
  principalInvestigator: { id: 7, fullName: 'Investigadora de Prueba' },
};

describe('ProtocolosTableComponent (F01 T01-7)', () => {
  function render(items: ProtocolListItem[]): HTMLElement {
    const fixture = TestBed.createComponent(ProtocolosTableComponent);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }
  const texto = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  it('columnas Protocolo, Investigador principal y Etapa (sin Estado), con caption y scope', () => {
    const el = render([ITEM]);
    const ths = Array.from(el.querySelectorAll('th'));
    expect(ths.map((th) => texto(th))).toEqual(['Protocolo', 'Investigador principal', 'Etapa']);
    expect(ths.every((th) => th.getAttribute('scope') === 'col')).toBeTrue();
    expect(texto(el.querySelector('caption'))).toBe('Protocolos');
  });

  it('fila con datos: código arriba, título, investigador y chip neutro de etapa', () => {
    const el = render([ITEM]);
    expect(texto(el.querySelector('.protocolos__codigo'))).toBe('IO-001-2026');
    expect(texto(el.querySelector('.protocolos__titulo'))).toBe('Estudio de prueba A');
    expect(texto(el.querySelector('.protocolos__investigador'))).toBe('Investigadora de Prueba');
    const chip = el.querySelector('.chip');
    expect(texto(chip)).toBe('Evaluación');
    expect(chip?.classList).toContain('chip--gris');
  });

  it('ceishCode null → "Sin código"', () => {
    expect(texto(render([{ ...ITEM, ceishCode: null }]).querySelector('.protocolos__codigo'))).toBe('Sin código');
  });

  it('principalInvestigator null → "Sin investigador principal"', () => {
    expect(texto(render([{ ...ITEM, principalInvestigator: null }]).querySelector('.protocolos__investigador'))).toBe(
      'Sin investigador principal',
    );
  });

  it('etapa null → "Etapa no reconocida" y la fila completa', () => {
    const el = render([{ ...ITEM, etapa: null }]);
    expect(texto(el.querySelector('.chip'))).toBe('Etapa no reconocida');
    expect(texto(el.querySelector('.protocolos__titulo'))).toBe('Estudio de prueba A');
  });

  it('sin "›", sin la nota "Clic en una fila…" y las filas no navegan', () => {
    const el = render([ITEM]);
    expect(texto(el)).not.toContain('›');
    expect(texto(el)).not.toContain('Clic en una fila');
    expect(el.querySelector('tbody a, tbody button, tbody [routerLink], tbody [tabindex]')).toBeNull();
  });
});
