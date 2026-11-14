import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { UndoToastService } from '../../shared/ui/undo-toast/undo-toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let dialog: jasmine.SpyObj<MatDialog>;
  let undoToast: jasmine.SpyObj<UndoToastService>;

  beforeEach(() => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    undoToast = jasmine.createSpyObj<UndoToastService>('UndoToastService', ['show']);
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: UndoToastService, useValue: undoToast },
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  it('notify() muestra el aviso con UndoToast (éxito por defecto, 4 s)', () => {
    service.notify('Usuario guardado');

    expect(undoToast.show).toHaveBeenCalledWith({
      message: 'Usuario guardado',
      tone: 'success',
      duration: 4000,
    });
  });

  it('notify() conserva el tipo de aviso', () => {
    service.notify('No se pudo guardar', 'error');
    service.notify('Sin cambios', 'info');

    expect(undoToast.show.calls.argsFor(0)[0].tone).toBe('error');
    expect(undoToast.show.calls.argsFor(1)[0].tone).toBe('info');
  });

  it('confirm() sigue abriendo el ConfirmDialog y devuelve su resultado', () => {
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as never);
    let result: boolean | undefined;

    service.confirm({ title: 'Eliminar', message: '¿Continuar?' }).subscribe((r) => (result = r));

    expect(dialog.open).toHaveBeenCalledWith(
      ConfirmDialogComponent,
      jasmine.objectContaining({ disableClose: true }),
    );
    expect(result).toBeTrue();
  });
});
