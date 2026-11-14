import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UNDO_TOAST_DEFAULT_DURATION, UndoToastService } from './undo-toast.service';

describe('UndoToastService', () => {
  let service: UndoToastService;

  beforeEach(() => {
    service = TestBed.inject(UndoToastService);
  });

  it('show() publica el aviso con tono de éxito por defecto', fakeAsync(() => {
    service.show({ message: 'Evaluador asignado' });

    expect(service.toast()).toEqual(
      jasmine.objectContaining({ message: 'Evaluador asignado', tone: 'success' }),
    );
    service.dismiss();
  }));

  it('se cierra solo tras la duración por defecto', fakeAsync(() => {
    service.show({ message: 'Guardado' });

    tick(UNDO_TOAST_DEFAULT_DURATION - 1);
    expect(service.toast()).not.toBeNull();
    tick(1);
    expect(service.toast()).toBeNull();
  }));

  it('respeta una duración propia', fakeAsync(() => {
    service.show({ message: 'Guardado', duration: 1000 });

    tick(1000);
    expect(service.toast()).toBeNull();
  }));

  it('un aviso nuevo reemplaza al anterior y reinicia el tiempo', fakeAsync(() => {
    service.show({ message: 'Primero', duration: 1000 });
    tick(800);
    service.show({ message: 'Segundo', duration: 1000, tone: 'error' });

    tick(500);
    expect(service.toast()?.message).toBe('Segundo');
    expect(service.toast()?.tone).toBe('error');
    tick(500);
    expect(service.toast()).toBeNull();
  }));

  it('undo() llama a la acción inversa y cierra el aviso', fakeAsync(() => {
    const undo = jasmine.createSpy('undo');
    service.show({ message: 'Protocolo archivado', undo });

    service.undo();

    expect(undo).toHaveBeenCalledTimes(1);
    expect(service.toast()).toBeNull();
    tick(UNDO_TOAST_DEFAULT_DURATION);
  }));

  it('undo() sin acción inversa no hace nada', fakeAsync(() => {
    service.show({ message: 'Guardado' });

    service.undo();

    expect(service.toast()).not.toBeNull();
    service.dismiss();
  }));

  it('dismiss() sin aviso abierto no falla', () => {
    expect(() => service.dismiss()).not.toThrow();
    expect(service.toast()).toBeNull();
  });
});
