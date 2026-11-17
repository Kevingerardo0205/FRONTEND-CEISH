import { protocolVersionLabel } from './protocol-header';

describe('protocolVersionLabel (F00 criterio 11)', () => {
  it('"2.0" se muestra como v2', () => {
    expect(protocolVersionLabel('2.0')).toBe('v2');
  });

  it('acepta el número sin decimales y con espacios alrededor', () => {
    expect(protocolVersionLabel('1')).toBe('v1');
    expect(protocolVersionLabel(' 3.0 ')).toBe('v3');
    expect(protocolVersionLabel('12.00')).toBe('v12');
  });

  it('si no se puede leer un entero ≥ 1, no se muestra', () => {
    for (const v of ['2.5', '0', '0.0', '', '   ', 'v2', 'dos', '-1', '1.0.0']) {
      expect(protocolVersionLabel(v)).withContext(JSON.stringify(v)).toBeNull();
    }
    expect(protocolVersionLabel(null)).toBeNull();
  });
});
