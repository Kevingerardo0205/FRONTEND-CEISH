import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { NEVER, of } from 'rxjs';

import { MisProtocolosPage } from './mis-protocolos.page';
import { ProtocoloService } from '../../../application/services/protocolo.service';
import { ProtocoloResumen, EstadoProtocolo } from '../../../domain/dtos/crear-protocolo.dto';
import { NotificationBrokerService } from '@infrastructure/services/notification-broker.service';

describe('MisProtocolosPage - continuar borrador', () => {
  const tituloBorrador = 'Estudio de prueba del investigador';
  const tituloRevision = 'Protocolo de investigacion en revision';

  beforeEach(async () => {
    const protocolos: ProtocoloResumen[] = [
      {
        id: 5,
        codigoCeish: 'CEISH-TEST-005',
        titulo: tituloBorrador,
        estado: EstadoProtocolo.BORRADOR,
        fechaCreacion: '2026-01-01',
      },
      {
        id: 6,
        codigoCeish: 'CEISH-TEST-006',
        titulo: tituloRevision,
        estado: EstadoProtocolo.EN_REVISION_SECRETARIA,
        fechaCreacion: '2026-01-02',
      },
    ];

    await TestBed.configureTestingModule({
      imports: [MisProtocolosPage, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ProtocoloService, useValue: { misProtocolos: () => of(protocolos) } },
        { provide: NotificationBrokerService, useValue: { on: () => NEVER } },
      ],
    }).compileComponents();
  });

  function render() {
    const fixture = TestBed.createComponent(MisProtocolosPage);
    fixture.detectChanges();
    return fixture;
  }

  it('la tarjeta BORRADOR tiene Continuar con aria-label e href al borrador', () => {
    const fixture = render();
    const link = fixture.debugElement.query(
      By.css('.protocol-card[data-status="BORRADOR"] a[aria-label="Continuar borrador: Estudio de prueba del investigador"]'),
    ).nativeElement as HTMLAnchorElement;

    expect(link.textContent).toContain('Continuar');
    expect(link.getAttribute('href')).toBe(
      '/dashboard/investigador/nuevo-protocolo?borrador=5',
    );
  });

  it('la tarjeta EN_REVISION_SECRETARIA no muestra Continuar', () => {
    const fixture = render();
    const card = fixture.nativeElement.querySelector(
      '.protocol-card[data-status="EN_REVISION_SECRETARIA"]',
    ) as HTMLElement;

    expect(card.textContent).not.toContain('Continuar');
  });

  it('el chip de la tarjeta BORRADOR dice Borrador', () => {
    const fixture = render();
    const chip = fixture.nativeElement.querySelector(
      '.protocol-card[data-status="BORRADOR"] .status-chip',
    ) as HTMLElement;

    expect(chip.textContent).toContain('Borrador');
  });
});

