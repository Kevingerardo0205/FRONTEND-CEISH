import { HttpErrorResponse } from '@angular/common/http';
import { GENERIC_API_ERROR_MESSAGE, extractApiErrorMessage } from './api-error-message.util';
import {
  ERROR_400_ARRAY_BODY,
  ERROR_400_BODY,
  ERROR_401_BODY,
  ERROR_404_BODY
} from '@features/evaluations/testing/reassignment.fixtures';

function httpError(body: unknown, status: number, statusText: string): HttpErrorResponse {
  return new HttpErrorResponse({ error: body, status, statusText, url: '/api/evaluations/protocol/0/active-assignments' });
}

describe('extractApiErrorMessage', () => {
  describe('cuerpo crudo (HttpErrorResponse, respaldo sin interceptor)', () => {
    it('400 real → body.error.message', () => {
      expect(extractApiErrorMessage(httpError(ERROR_400_BODY, 400, 'Bad Request')))
        .toBe('Validation failed (numeric string is expected)');
    });

    it('404 real → body.error.message', () => {
      expect(extractApiErrorMessage(httpError(ERROR_404_BODY, 404, 'Not Found')))
        .toBe('El protocolo con ID 0 no existe.');
    });

    it('401 real → body.error.message', () => {
      expect(extractApiErrorMessage(httpError(ERROR_401_BODY, 401, 'Unauthorized'))).toBe('Unauthorized');
    });

    it('400 con message como arreglo → mensajes unidos con "; "', () => {
      expect(extractApiErrorMessage(httpError(ERROR_400_ARRAY_BODY, 400, 'Bad Request')))
        .toBe('replacementEvaluatorId must be a number; reason must be one of the following values');
    });

    it('no usa el message técnico de HttpErrorResponse si el cuerpo no trae mensaje', () => {
      expect(extractApiErrorMessage(httpError(null, 500, 'Internal Server Error'), 'Respaldo')).toBe('Respaldo');
    });
  });

  describe('Error ya procesado por ErrorInterceptor', () => {
    it('usa err.message (lo que el interceptor extrajo del cuerpo real)', () => {
      expect(extractApiErrorMessage(new Error('El protocolo con ID 0 no existe.'))).toBe('El protocolo con ID 0 no existe.');
    });

    it('acepta el objeto CONCURRENCY_ERROR del 409', () => {
      expect(extractApiErrorMessage({ type: 'CONCURRENCY_ERROR', status: 409, message: 'Trámite actualizado' }))
        .toBe('Trámite actualizado');
    });
  });

  it('respaldo genérico en español ante errores sin mensaje', () => {
    expect(extractApiErrorMessage(new Error(''))).toBe(GENERIC_API_ERROR_MESSAGE);
    expect(extractApiErrorMessage(undefined)).toBe(GENERIC_API_ERROR_MESSAGE);
  });
});
