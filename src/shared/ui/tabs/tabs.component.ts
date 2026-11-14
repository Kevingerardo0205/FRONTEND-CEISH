import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  model,
} from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
}

/**
 * Pestañas subrayadas (spec-ui F00 §5). Solo se usan dentro del espacio de un protocolo;
 * para cambiar de vista en un módulo se usa ButtonGroup.
 */
@Component({
  selector: 'app-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs" role="tablist" [attr.aria-label]="label()">
      @for (tab of tabs(); track tab.id; let i = $index) {
        <button
          type="button"
          role="tab"
          class="tabs__tab"
          [class.tabs__tab--active]="tab.id === active()"
          [attr.aria-selected]="tab.id === active()"
          [attr.tabindex]="tab.id === active() ? 0 : -1"
          (click)="active.set(tab.id)"
          (keydown)="onKeydown($event, i)"
        >
          {{ tab.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly tabs = input.required<readonly TabItem[]>();
  readonly active = model.required<string>();
  readonly label = input<string>();

  onKeydown(event: KeyboardEvent, index: number): void {
    const last = this.tabs().length - 1;
    const target =
      event.key === 'ArrowRight'
        ? (index + 1) % (last + 1)
        : event.key === 'ArrowLeft'
          ? (index - 1 + last + 1) % (last + 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (target === null) return;

    event.preventDefault();
    this.active.set(this.tabs()[target].id);
    this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[role="tab"]')[target]?.focus();
  }
}
