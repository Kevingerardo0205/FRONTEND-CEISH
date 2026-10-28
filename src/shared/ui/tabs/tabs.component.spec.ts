import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsComponent } from './tabs.component';

describe('TabsComponent', () => {
  let fixture: ComponentFixture<TabsComponent>;
  let el: HTMLElement;
  const tabs = () => Array.from(el.querySelectorAll('[role="tab"]')) as HTMLButtonElement[];
  const key = (index: number, k: string) => {
    tabs()[index].dispatchEvent(new KeyboardEvent('keydown', { key: k, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TabsComponent] });
    fixture = TestBed.createComponent(TabsComponent);
    fixture.componentRef.setInput('tabs', [
      { id: 'evaluadores', label: 'Evaluadores y dictámenes' },
      { id: 'riesgo', label: 'Riesgo' },
      { id: 'recorrido', label: 'Recorrido' },
    ]);
    fixture.componentRef.setInput('active', 'evaluadores');
    fixture.componentRef.setInput('label', 'Evaluación');
    fixture.detectChanges();
    el = fixture.nativeElement;
    document.body.appendChild(el);
  });

  afterEach(() => el.remove());

  it('expone una lista de pestañas con la activa seleccionada', () => {
    expect(el.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Evaluación');
    expect(tabs().map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(tabs().map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    expect(tabs()[0].classList).toContain('tabs__tab--active');
  });

  it('al hacer clic cambia la pestaña activa', () => {
    tabs()[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.active()).toBe('riesgo');
    expect(tabs()[1].getAttribute('aria-selected')).toBe('true');
  });

  it('se navega con flechas, Inicio y Fin, y el foco acompaña', () => {
    key(0, 'ArrowRight');
    expect(fixture.componentInstance.active()).toBe('riesgo');
    expect(document.activeElement).toBe(tabs()[1]);

    key(1, 'End');
    expect(fixture.componentInstance.active()).toBe('recorrido');

    key(2, 'ArrowRight');
    expect(fixture.componentInstance.active()).toBe('evaluadores');

    key(0, 'ArrowLeft');
    expect(fixture.componentInstance.active()).toBe('recorrido');

    key(2, 'Home');
    expect(fixture.componentInstance.active()).toBe('evaluadores');
    expect(document.activeElement).toBe(tabs()[0]);
  });

  it('ignora otras teclas', () => {
    key(0, 'Enter');

    expect(fixture.componentInstance.active()).toBe('evaluadores');
  });
});
