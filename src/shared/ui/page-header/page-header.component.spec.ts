import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  let el: HTMLElement;

  function render(inputs: Record<string, string>): void {
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  const button = () => el.querySelector('button') as HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PageHeaderComponent] });
    fixture = TestBed.createComponent(PageHeaderComponent);
  });

  it('muestra título y subtítulo', () => {
    render({ heading: 'Protocolos', subtitle: 'Todos los protocolos activos' });

    expect(el.querySelector('h1')?.textContent).toContain('Protocolos');
    expect(el.querySelector('.page-header__subtitle')?.textContent).toContain(
      'Todos los protocolos activos',
    );
  });

  it('sin acción no muestra botones', () => {
    render({ heading: 'Protocolos' });

    expect(el.querySelectorAll('button').length).toBe(0);
    expect(el.querySelector('.page-header__subtitle')).toBeNull();
  });

  it('tiene una sola acción principal con su texto de ayuda', () => {
    render({ heading: 'Recepción', actionLabel: 'Validar', actionHelp: 'Confirma los requisitos' });
    const emitted = jasmine.createSpy('action');
    fixture.componentInstance.action.subscribe(emitted);

    expect(el.querySelectorAll('button').length).toBe(1);
    expect(button().disabled).toBeFalse();
    const hint = el.querySelector(`#${button().getAttribute('aria-describedby')}`);
    expect(hint?.textContent).toContain('Confirma los requisitos');

    button().click();
    expect(emitted).toHaveBeenCalledTimes(1);
  });

  it('deshabilita la acción y muestra el motivo', () => {
    render({
      heading: 'Recepción',
      actionLabel: 'Validar',
      actionHelp: 'Confirma los requisitos',
      disabledReason: 'Falta revisar 1 documento',
    });
    const emitted = jasmine.createSpy('action');
    fixture.componentInstance.action.subscribe(emitted);

    expect(button().disabled).toBeTrue();
    const hint = el.querySelector(`#${button().getAttribute('aria-describedby')}`);
    expect(hint?.textContent).toContain('Falta revisar 1 documento');
    expect(el.textContent).not.toContain('Confirma los requisitos');

    fixture.componentInstance.onAction();
    expect(emitted).not.toHaveBeenCalled();
  });

  it('sin ayuda ni motivo no enlaza aria-describedby', () => {
    render({ heading: 'Recepción', actionLabel: 'Validar' });

    expect(button().hasAttribute('aria-describedby')).toBeFalse();
  });
});
