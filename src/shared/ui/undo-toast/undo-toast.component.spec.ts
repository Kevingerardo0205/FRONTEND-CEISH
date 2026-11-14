import { TestBed, fakeAsync } from '@angular/core/testing';
import { UndoToastComponent, UndoToastHostComponent } from './undo-toast.component';
import { UndoToastService } from './undo-toast.service';

describe('UndoToastComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [UndoToastComponent] }));

  it('muestra el mensaje con su tono y "Deshacer" solo si se puede deshacer', () => {
    const fixture = TestBed.createComponent(UndoToastComponent);
    fixture.componentRef.setInput('message', 'Guardado');
    fixture.componentRef.setInput('tone', 'error');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.toast')?.classList).toContain('toast--error');
    expect(el.textContent).toContain('Guardado');
    expect(el.textContent).not.toContain('Deshacer');

    fixture.componentRef.setInput('canUndo', true);
    fixture.detectChanges();
    expect(el.querySelector('.toast__undo')?.textContent).toContain('Deshacer');
  });

  it('emite undo y dismiss', () => {
    const fixture = TestBed.createComponent(UndoToastComponent);
    fixture.componentRef.setInput('message', 'Guardado');
    fixture.componentRef.setInput('canUndo', true);
    fixture.detectChanges();
    const undo = jasmine.createSpy('undo');
    const dismiss = jasmine.createSpy('dismiss');
    fixture.componentInstance.undo.subscribe(undo);
    fixture.componentInstance.dismiss.subscribe(dismiss);
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('.toast__undo') as HTMLButtonElement).click();
    (el.querySelector('.toast__close') as HTMLButtonElement).click();

    expect(undo).toHaveBeenCalledTimes(1);
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(el.querySelector('.toast__close')?.getAttribute('aria-label')).toBe('Cerrar aviso');
  });
});

describe('UndoToastHostComponent', () => {
  let service: UndoToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [UndoToastHostComponent] });
    service = TestBed.inject(UndoToastService);
  });

  afterEach(() => service.dismiss());

  it('tiene una región role="status" con aria-live="polite" aunque no haya aviso', () => {
    const fixture = TestBed.createComponent(UndoToastHostComponent);
    fixture.detectChanges();
    const region = (fixture.nativeElement as HTMLElement).querySelector('.toast-host');

    expect(region?.getAttribute('role')).toBe('status');
    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.querySelector('app-undo-toast')).toBeNull();
  });

  it('criterio 5: al pulsar Deshacer se llama a la acción inversa y el aviso desaparece', fakeAsync(() => {
    const fixture = TestBed.createComponent(UndoToastHostComponent);
    const undo = jasmine.createSpy('undo');
    service.show({ message: 'Evaluador asignado', undo });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Evaluador asignado');

    (el.querySelector('.toast__undo') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(undo).toHaveBeenCalledTimes(1);
    expect(el.querySelector('app-undo-toast')).toBeNull();
  }));

  it('el botón cerrar quita el aviso', fakeAsync(() => {
    const fixture = TestBed.createComponent(UndoToastHostComponent);
    service.show({ message: 'Guardado' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('.toast__close') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('app-undo-toast')).toBeNull();
  }));
});
