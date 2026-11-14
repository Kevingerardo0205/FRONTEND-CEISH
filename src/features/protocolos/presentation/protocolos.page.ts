import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { Stage } from '@domain/value-objects/stage.vo';
import { ButtonGroupComponent, ButtonGroupOption } from '@shared/ui/button-group/button-group.component';
import { FilterBarComponent, FilterState } from '@shared/ui/filter-bar/filter-bar.component';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { PagerComponent } from '@shared/ui/pager/pager.component';
import {
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingStateComponent,
} from '@shared/ui/states/states.component';
import { anioEcuador } from '@shared/utils/fecha-ecuador.util';
import { ProtocolosFacade } from '../application/protocolos.facade';
import { ProtocolListQuery } from '../domain/protocol-list-item.model';
import { ANIO_MINIMO, SEARCH_MAXIMO, queryDesdeUrl } from '../domain/protocol-list-query.rules';
import { ProtocolosTableComponent } from './components/protocolos-table/protocolos-table.component';

const TODAS = 'TODOS';
export const DEBOUNCE_BUSQUEDA_MS = 300;

/**
 * Protocolos en /protocolos (F01 T01-7, spec-ui §3.2). Etapa, búsqueda, año y página van en la
 * URL (§6): la URL manda, se valida con `queryDesdeUrl` y se pide con la fachada. Cambiar etapa,
 * búsqueda o año vuelve a la página 1 (se quita `page`).
 */
@Component({
  selector: 'app-protocolos-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    ButtonGroupComponent,
    FilterBarComponent,
    ProtocolosTableComponent,
    PagerComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  providers: [ProtocolosFacade],
  templateUrl: './protocolos.page.html',
  styleUrl: './protocolos.page.scss',
})
export class ProtocolosPage implements OnInit {
  readonly facade = inject(ProtocolosFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly filterBar = viewChild(FilterBarComponent);
  private readonly busqueda$ = new Subject<string>();

  /** Año en curso en hora de Ecuador (no `getFullYear()` del navegador). */
  readonly anioActual = anioEcuador();
  readonly searchMaximo = SEARCH_MAXIMO;
  readonly anios = Array.from({ length: this.anioActual - ANIO_MINIMO + 1 }, (_, i) =>
    String(this.anioActual - i),
  );
  readonly etapas: ButtonGroupOption[] = [
    { id: TODAS, label: 'Todos' },
    ...Stage.all().map((s) => ({ id: s.code, label: s.label })),
  ];

  readonly query = signal<ProtocolListQuery>({ page: 1, limit: 20 });
  readonly etapaActiva = computed(() => this.query().etapa ?? TODAS);
  readonly titulo = computed(() => {
    const etapa = this.query().etapa;
    return etapa ? `Protocolos · ${Stage.fromBackend(etapa).label}` : 'Protocolos';
  });
  readonly conFiltros = computed(() => {
    const q = this.query();
    return !!(q.etapa || q.search || q.year);
  });

  constructor() {
    // La URL manda sobre lo que FilterBar recuerda de la visita anterior.
    effect(() => {
      const search = this.query().search ?? '';
      const bar = this.filterBar();
      untracked(() => {
        if (bar && bar.state().search.trim() !== search) bar.reset({ search, filters: {} });
      });
    });

    afterNextRender(() => {
      const h1 = this.host.nativeElement.querySelector<HTMLElement>('h1');
      if (!h1) return;
      h1.setAttribute('tabindex', '-1');
      h1.focus();
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const etapa = params.get('etapa');
      const q = queryDesdeUrl(params, this.anioActual);
      if (etapa !== null && q.etapa === undefined) {
        // §3.2: una etapa desconocida se trata como Todos y se quita de la URL.
        this.navegar({ etapa: null }, true);
        return;
      }
      this.query.set(q);
      this.facade.cargar(q);
    });

    this.busqueda$
      .pipe(
        debounceTime(DEBOUNCE_BUSQUEDA_MS),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((texto) => {
        if (texto !== (this.query().search ?? '')) this.navegar({ search: texto || null, page: null });
      });
  }

  cambiarEtapa(id: string): void {
    const etapa = id === TODAS ? null : id;
    if (etapa !== (this.query().etapa ?? null)) this.navegar({ etapa, page: null });
  }

  buscar(estado: FilterState): void {
    this.busqueda$.next(estado.search.trim());
  }

  cambiarAnio(valor: string): void {
    this.navegar({ year: valor || null, page: null });
  }

  cambiarPagina(page: number): void {
    this.navegar({ page });
  }

  limpiarFiltros(): void {
    this.filterBar()?.reset({ search: '', filters: {} });
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  private navegar(cambios: Params, reemplazar = false): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cambios,
      queryParamsHandling: 'merge',
      replaceUrl: reemplazar,
    });
  }
}
