import { TestBed } from '@angular/core/testing';
import {
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
} from './states.component';

describe('Estados (empty, loading, error)', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [EmptyStateComponent, LoadingStateComponent, ErrorStateComponent],
    }),
  );

  it('EmptyState muestra el mensaje por defecto y la sugerencia opcional', () => {
    const fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No hay nada por aquí todavía.');
    expect(el.querySelector('.state__hint')).toBeNull();

    fixture.componentRef.setInput('message', 'No hay protocolos en esta etapa.');
    fixture.componentRef.setInput('hint', 'Cambie los filtros.');
    fixture.detectChanges();
    expect(el.textContent).toContain('No hay protocolos en esta etapa.');
    expect(el.querySelector('.state__hint')?.textContent).toContain('Cambie los filtros.');
  });

  it('LoadingState se anuncia como estado', () => {
    const fixture = TestBed.createComponent(LoadingStateComponent);
    fixture.detectChanges();
    const status = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');

    expect(status?.textContent).toContain('Cargando…');
  });

  it('ErrorState se anuncia como alerta y permite reintentar', () => {
    const fixture = TestBed.createComponent(ErrorStateComponent);
    const retry = jasmine.createSpy('retry');
    fixture.componentInstance.retry.subscribe(retry);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No pudimos cargar');
    (el.querySelector('button') as HTMLButtonElement).click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('ErrorState puede ocultar el botón de reintentar', () => {
    const fixture = TestBed.createComponent(ErrorStateComponent);
    fixture.componentRef.setInput('showRetry', false);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });
});
