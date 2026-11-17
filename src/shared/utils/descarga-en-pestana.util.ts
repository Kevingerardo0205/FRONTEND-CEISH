/**
 * Descarga de un archivo con URL firmada en una pestaña nueva (F09 D28, F08 D6).
 *
 * La pestaña se abre al suscribirse, que debe ser dentro del clic: así el navegador no la bloquea
 * aunque la URL llegue después. La pestaña queda sin `opener`, solo navega a una URL `https:` (o
 * `http:` en `localhost`/`127.0.0.1`) y se cierra si la petición falla, la URL no pasa la
 * comprobación, la petición termina sin respuesta o se cancela antes. La URL nunca se guarda: cada
 * suscripción la vuelve a pedir.
 */
import { Observable } from 'rxjs';
import { apiErrorStatus } from './api-error-message.util';

/** Resultado de `abrirEnPestana`; cada pantalla decide su texto. */
export type ResultadoDescarga = 'abierta' | 'bloqueada' | 'no-disponible' | 'error';

const HOSTS_LOCALES = ['localhost', '127.0.0.1'];

/** La URL solo se abre si es `https:`, o `http:` en `localhost`/`127.0.0.1`. */
export function esUrlDeDescargaValida(url: unknown): url is string {
  if (typeof url !== 'string' || url.trim() === '') return false;
  let destino: URL;
  try {
    destino = new URL(url);
  } catch {
    return false;
  }
  if (destino.protocol === 'https:') return true;
  return destino.protocol === 'http:' && HOSTS_LOCALES.includes(destino.hostname);
}

/**
 * Abre una pestaña vacía, pide la URL con `pedirUrl` (solo después de abrir la pestaña) y lleva
 * la pestaña a ella.
 * Emite un solo resultado y termina: `bloqueada` sin pedir nada si el navegador no abre la
 * pestaña, `no-disponible` con un 404 y `error` con cualquier otra falla.
 */
export function abrirEnPestana(
  pedirUrl: () => Observable<{ downloadUrl?: unknown } | null | undefined>,
): Observable<ResultadoDescarga> {
  return new Observable<ResultadoDescarga>((suscriptor) => {
    const pestana = window.open('', '_blank');
    if (!pestana) {
      suscriptor.next('bloqueada');
      suscriptor.complete();
      return undefined;
    }
    pestana.opener = null;

    let terminado = false;
    const terminar = (resultado: ResultadoDescarga) => {
      terminado = true;
      if (resultado !== 'abierta') pestana.close();
      suscriptor.next(resultado);
      suscriptor.complete();
    };

    const peticion = pedirUrl().subscribe({
      next: (respuesta) => {
        if (terminado) return;
        const url: unknown = respuesta?.downloadUrl;
        if (esUrlDeDescargaValida(url)) {
          pestana.location.href = url;
          terminar('abierta');
        } else {
          terminar('error');
        }
      },
      error: (err: unknown) => {
        if (!terminado) terminar(apiErrorStatus(err) === 404 ? 'no-disponible' : 'error');
      },
      complete: () => {
        if (!terminado) terminar('error');
      },
    });

    return () => {
      peticion.unsubscribe();
      // Cancelada antes de la respuesta (la página cambió o se destruyó): la pestaña vacía se cierra.
      if (!terminado) pestana.close();
    };
  });
}
