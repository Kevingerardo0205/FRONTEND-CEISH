import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';

export interface FilterState {
  search: string;
  filters: Readonly<Record<string, string>>;
}

const EMPTY_STATE: FilterState = { search: '', filters: {} };
let nextId = 0;

/**
 * Búsqueda + filtros propios de la vista (spec-ui F00 §5).
 * Los filtros se proyectan con <ng-content> y se leen/escriben con filter()/setFilter().
 * Recuerda los valores de cada `viewKey` en memoria mientras dure la sesión de la app.
 * Al cambiar de vista, `state` pasa a los valores recordados; `changed` solo se emite
 * cuando el usuario cambia algo.
 */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss',
})
export class FilterBarComponent {
  private static readonly memory = new Map<string, FilterState>();

  readonly viewKey = input.required<string>();
  readonly placeholder = input('Buscar');
  readonly searchLabel = input('Buscar');

  readonly changed = output<FilterState>();

  readonly searchId = `filter-bar-search-${nextId++}`;
  private readonly stateSignal = signal<FilterState>(EMPTY_STATE);
  readonly state = this.stateSignal.asReadonly();

  constructor() {
    effect(() => {
      const key = this.viewKey();
      untracked(() => this.stateSignal.set(FilterBarComponent.memory.get(key) ?? EMPTY_STATE));
    });
  }

  filter(key: string): string {
    return this.state().filters[key] ?? '';
  }

  onSearchInput(event: Event): void {
    this.update({ ...this.state(), search: (event.target as HTMLInputElement).value });
  }

  setFilter(key: string, value: string | null): void {
    const filters = { ...this.state().filters };
    if (value === null || value === '') delete filters[key];
    else filters[key] = value;
    this.update({ ...this.state(), filters });
  }

  clear(): void {
    this.update(EMPTY_STATE);
  }

  private update(state: FilterState): void {
    this.stateSignal.set(state);
    FilterBarComponent.memory.set(this.viewKey(), state);
    this.changed.emit(state);
  }
}
