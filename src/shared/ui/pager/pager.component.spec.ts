import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagerComponent } from './pager.component';

describe('PagerComponent (F01 T01-7)', () => {
  let fixture: ComponentFixture<PagerComponent>;
  let emitidos: number[];

  function render(page: number, total: number, limit = 20): HTMLElement {
    fixture = TestBed.createComponent(PagerComponent);
    emitidos = [];
    // Un output de Angular no tiene canal de error: solo emite.
    fixture.componentInstance.pageChange.subscribe((p) => emitidos.push(p));
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('limit', limit);
    fixture.componentRef.setInput('total', total);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const botones = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLButtonElement>('button'));
  const info = (el: HTMLElement) => el.querySelector('.pager__info')?.textContent?.trim();

  it('página 2 de 57: "Mostrando 21–40 de 57", en aria-live="polite"', () => {
    const el = render(2, 57);
    expect(info(el)).toBe('Mostrando 21–40 de 57');
    expect(el.querySelector('.pager__info')?.getAttribute('aria-live')).toBe('polite');
  });

  it('última página: "Mostrando 41–57 de 57"; Siguiente deshabilitado', () => {
    const el = render(3, 57);
    expect(info(el)).toBe('Mostrando 41–57 de 57');
    const [anterior, siguiente] = botones(el);
    expect(anterior.disabled).toBeFalse();
    expect(siguiente.disabled).toBeTrue();
  });

  it('primera página: Anterior deshabilitado; Siguiente emite 2', () => {
    const el = render(1, 57);
    const [anterior, siguiente] = botones(el);
    expect(anterior.disabled).toBeTrue();
    siguiente.click();
    expect(emitidos).toEqual([2]);
  });

  it('Anterior emite la página anterior', () => {
    botones(render(3, 57))[0].click();
    expect(emitidos).toEqual([2]);
  });

  it('una sola página: los dos botones deshabilitados', () => {
    const el = render(1, 5);
    expect(info(el)).toBe('Mostrando 1–5 de 5');
    expect(botones(el).every((b) => b.disabled)).toBeTrue();
  });

  it('con total 0 no se muestra el paginador', () => {
    const el = render(1, 0);
    expect(el.querySelector('.pager')).toBeNull();
  });
});
