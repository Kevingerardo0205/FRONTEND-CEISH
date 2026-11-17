import { ChangeDetectionStrategy, Component, inject, input, linkedSignal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonGroupComponent, ButtonGroupOption } from '@shared/ui/button-group/button-group.component';

export type SeccionConfiguracion = 'usuarios' | 'formatos';

/** Secciones de Configuración (F08 D2): `Usuarios · Formatos`, con la página abierta activa. */
@Component({
  selector: 'app-config-secciones',
  standalone: true,
  imports: [ButtonGroupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-button-group
      label="Secciones de Configuración"
      [options]="secciones"
      [active]="seleccion()"
      (activeChange)="ir($event)"
    />
  `,
})
export class ConfigSeccionesComponent {
  private readonly router = inject(Router);

  readonly activa = input.required<SeccionConfiguracion>();

  readonly secciones: readonly ButtonGroupOption[] = [
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'formatos', label: 'Formatos' },
  ];

  /** El botón marcado; vuelve a la página abierta si la navegación no se completa. */
  readonly seleccion = linkedSignal(() => this.activa());

  ir(id: string): void {
    if (id === this.activa()) return;
    this.seleccion.set(id as SeccionConfiguracion);
    const volver = () => this.seleccion.set(this.activa());
    this.router.navigate(['/configuracion', id]).then((ok) => {
      if (!ok) volver();
    }, volver);
  }
}
