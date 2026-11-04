import { backendErrorMessage, isAccountLocked, isEmailVerificationRequired } from './auth-errors';

/** Cuerpo del HttpExceptionFilter del backend (mensaje en body.error.message). */
const filtered = (status: number, message: unknown) => ({
  status,
  error: { statusCode: status, error: { message, statusCode: status } },
});
/** Cuerpo por defecto de Nest (mensaje en body.message). */
const plain = (status: number, message: unknown) => ({ status, error: { message } });

const VERIFY = 'Por favor, confirma tu correo electrónico antes de iniciar sesión.';
const LOCKED = 'Account temporarily locked. Try again later.';

describe('auth-errors (T13d-4)', () => {
  describe('isEmailVerificationRequired', () => {
    it('reconoce el texto real del backend en body.error.message', () => {
      expect(isEmailVerificationRequired(filtered(403, VERIFY))).toBeTrue();
    });

    it('reconoce el texto real del backend en body.message', () => {
      expect(isEmailVerificationRequired(plain(403, VERIFY))).toBeTrue();
    });

    it("reconoce 'verificar' y 'OTP' (textos que ya reconocía el interceptor)", () => {
      expect(isEmailVerificationRequired(plain(403, 'Debe verificar su cuenta'))).toBeTrue();
      expect(isEmailVerificationRequired(plain(403, 'Ingrese el OTP enviado'))).toBeTrue();
    });

    it('no reconoce el 403 de cuenta bloqueada', () => {
      expect(isEmailVerificationRequired(filtered(403, LOCKED))).toBeFalse();
    });

    it('no reconoce un 403 genérico', () => {
      expect(isEmailVerificationRequired(plain(403, 'Forbidden resource'))).toBeFalse();
    });

    it('no reconoce el texto de verificación con otro status', () => {
      expect(isEmailVerificationRequired(filtered(401, VERIFY))).toBeFalse();
      expect(isEmailVerificationRequired(filtered(400, VERIFY))).toBeFalse();
    });

    it('no reconoce un Error sin status ni valores vacíos', () => {
      expect(isEmailVerificationRequired(new Error(VERIFY))).toBeFalse();
      expect(isEmailVerificationRequired(null)).toBeFalse();
      expect(isEmailVerificationRequired(undefined)).toBeFalse();
      expect(isEmailVerificationRequired({ status: 403 })).toBeFalse();
    });
  });

  describe('isAccountLocked', () => {
    it('reconoce el 403 de bloqueo', () => {
      expect(isAccountLocked(filtered(403, LOCKED))).toBeTrue();
    });

    it('no reconoce la verificación de correo ni un 401', () => {
      expect(isAccountLocked(filtered(403, VERIFY))).toBeFalse();
      expect(isAccountLocked(filtered(401, LOCKED))).toBeFalse();
    });
  });

  describe('backendErrorMessage', () => {
    it('lee body.message y body.error.message', () => {
      expect(backendErrorMessage(plain(401, 'a'))).toBe('a');
      expect(backendErrorMessage(filtered(401, 'b'))).toBe('b');
    });

    it('une un arreglo de mensajes con "; " y devuelve null sin mensaje', () => {
      expect(backendErrorMessage(filtered(400, ['x', 'y']))).toBe('x; y');
      expect(backendErrorMessage({ status: 500, error: null })).toBeNull();
      expect(backendErrorMessage(new Error('sin cuerpo'))).toBeNull();
    });
  });
});
