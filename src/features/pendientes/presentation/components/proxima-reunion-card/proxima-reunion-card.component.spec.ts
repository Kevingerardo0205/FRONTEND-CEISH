import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NextMeeting } from '@domain/entities/meeting.entity';
import { ProximaReunionCardComponent } from './proxima-reunion-card.component';

const REUNION: NextMeeting = {
  id: 'm-1',
  numeroConvocatoria: '12',
  tipoSesion: 'ORDINARIA',
  // 14:00 UTC = 09:00 en Ecuador
  fechaReunion: '2026-11-10T14:00:00.000Z',
  lugar: { nombre: 'Sala de prueba', esVirtual: false, enlaceReunion: null },
  protocolosATratar: 3,
};

describe('ProximaReunionCardComponent (F01 T01-5)', () => {
  let fixture: ComponentFixture<ProximaReunionCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProximaReunionCardComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(ProximaReunionCardComponent);
  });

  function render(estado: 'cargando' | 'listo' | 'error', reunion: NextMeeting | null = null) {
    fixture.componentRef.setInput('estado', estado);
    fixture.componentRef.setInput('reunion', reunion);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const texto = (el: HTMLElement) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const verConvocatoria = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('a')).find((a) => texto(a) === 'Ver convocatoria');

  it('con datos: convocatoria, tipo, dd/MM/yyyy, HH:mm (Ecuador), lugar y protocolos a tratar', () => {
    const el = render('listo', REUNION);
    const t = texto(el);
    expect(t).toContain('Convocatoria N.º 12 · Ordinaria');
    expect(t).toContain('10/11/2026, 09:00');
    expect(t).toContain('Sala de prueba');
    expect(t).toContain('3 protocolos a tratar');
  });

  it('1 protocolo a tratar (singular) y tipo Extraordinaria', () => {
    const t = texto(render('listo', { ...REUNION, tipoSesion: 'EXTRAORDINARIA', protocolosATratar: 1 }));
    expect(t).toContain('· Extraordinaria');
    expect(t).toContain('1 protocolo a tratar');
  });

  it('nunca muestra "informes"', () => {
    const conInformes = { ...REUNION, informesATratar: 4 } as NextMeeting;
    expect(texto(render('listo', conInformes)).toLowerCase()).not.toContain('informe');
  });

  it('lugar null: no hay línea de lugar y el resto se ve', () => {
    const el = render('listo', { ...REUNION, lugar: null });
    expect(el.querySelector('.reunion__lugar')).toBeNull();
    expect(texto(el)).toContain('3 protocolos a tratar');
  });

  it('presencial: sin "Unirse" ni "Enlace no disponible"', () => {
    const t = texto(render('listo', REUNION));
    expect(t).not.toContain('Unirse a la reunión');
    expect(t).not.toContain('Enlace no disponible');
  });

  it('virtual con enlace: href, target="_blank" y rel="noopener noreferrer"', () => {
    const el = render('listo', {
      ...REUNION,
      lugar: { nombre: 'Sala virtual', esVirtual: true, enlaceReunion: 'https://meet.example.test/abc' },
    });
    const a = el.querySelector<HTMLAnchorElement>('a.reunion__unirse');
    expect(a).not.toBeNull();
    expect(a?.getAttribute('href')).toBe('https://meet.example.test/abc');
    expect(a?.getAttribute('target')).toBe('_blank');
    expect(a?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a?.getAttribute('aria-label')).toBe('Unirse a la reunión (se abre en otra pestaña)');
    expect(texto(a!)).toBe('Unirse a la reunión');
  });

  it('virtual con enlace null → "Enlace no disponible" y sin enlace', () => {
    const el = render('listo', {
      ...REUNION,
      lugar: { nombre: 'Sala virtual', esVirtual: true, enlaceReunion: null },
    });
    expect(el.querySelector('a.reunion__unirse')).toBeNull();
    expect(texto(el)).toContain('Enlace no disponible');
  });

  it('"Ver convocatoria" con href /convocatorias cuando hay datos', () => {
    const a = verConvocatoria(render('listo', REUNION));
    expect(a?.getAttribute('href')).toBe('/convocatorias');
  });

  it('data null → "No hay una reunión programada." y sin "Ver convocatoria"', () => {
    const el = render('listo', null);
    expect(texto(el)).toContain('No hay una reunión programada.');
    expect(verConvocatoria(el)).toBeUndefined();
  });

  it('cargando → "Cargando la próxima reunión…" y sin "Ver convocatoria"', () => {
    const el = render('cargando');
    expect(texto(el)).toContain('Cargando la próxima reunión…');
    expect(verConvocatoria(el)).toBeUndefined();
  });

  it('error → ErrorState con Reintentar (emite reintentar) y sin "Ver convocatoria"', () => {
    const el = render('error');
    let reintentos = 0;
    // Un output de Angular no tiene canal de error: solo emite.
    fixture.componentInstance.reintentar.subscribe(() => reintentos++);

    expect(texto(el)).toContain('No pudimos cargar la próxima reunión.');
    expect(verConvocatoria(el)).toBeUndefined();
    el.querySelector<HTMLButtonElement>('.state__retry')?.click();
    expect(reintentos).toBe(1);
  });

  it('fecha inválida → "Fecha no disponible"', () => {
    expect(texto(render('listo', { ...REUNION, fechaReunion: 'no-es-fecha' }))).toContain(
      'Fecha no disponible',
    );
  });
});
