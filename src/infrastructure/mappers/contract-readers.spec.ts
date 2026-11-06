import {
  ContractError,
  asArray,
  asObject,
  bool,
  idValue,
  nullableNum,
  nullableStr,
  num,
  oneOf,
  safeHttpUrl,
  str,
  stripTransportEnvelope,
  unwrapData,
} from './contract-readers';

function errorDe(fn: () => unknown): ContractError {
  try {
    fn();
  } catch (e) {
    if (e instanceof ContractError) return e;
    throw e;
  }
  throw new Error('no lanzó');
}

describe('contract-readers (F01 T01-2)', () => {
  it('ContractError lleva la ruta y lo esperado', () => {
    const e = new ContractError('data.title', 'string');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ContractError');
    expect(e.path).toBe('data.title');
    expect(e.expected).toBe('string');
    expect(e.message).toContain('"data.title" debe ser string');
  });

  it('asObject: acepta un objeto; null, arreglo o texto lanzan', () => {
    expect(asObject({ a: 1 }, 'data')).toEqual({ a: 1 });
    for (const v of [null, [], 'x', 3, undefined]) {
      expect(errorDe(() => asObject(v, 'data')).path).toBe('data');
    }
  });

  it('asArray: acepta un arreglo; un objeto lanza', () => {
    expect(asArray([1], 'data.items')).toEqual([1]);
    const e = errorDe(() => asArray({}, 'data.items'));
    expect([e.path, e.expected]).toEqual(['data.items', 'array']);
  });

  it('str: acepta texto (también vacío); número, null, objeto o ausente lanzan', () => {
    expect(str({ t: 'Hola' }, 't', 'p')).toBe('Hola');
    expect(str({ t: '' }, 't', 'p')).toBe('');
    for (const v of [1, null, { a: 1 }, ['x'], undefined, true]) {
      const e = errorDe(() => str({ t: v }, 't', 'data.items[0]'));
      expect([e.path, e.expected]).toEqual(['data.items[0].t', 'string']);
    }
  });

  it('nullableStr: acepta texto o null; un objeto o un número lanzan (nunca "[object Object]")', () => {
    expect(nullableStr({ c: 'IO-999-2026' }, 'c', 'p')).toBe('IO-999-2026');
    expect(nullableStr({ c: null }, 'c', 'p')).toBeNull();
    for (const v of [{ a: 1 }, 5, undefined, false]) {
      const e = errorDe(() => nullableStr({ c: v }, 'c', 'data'));
      expect([e.path, e.expected]).toEqual(['data.c', 'string | null']);
    }
  });

  it('num: acepta un número finito; texto, NaN o Infinity lanzan', () => {
    expect(num({ n: 0 }, 'n', 'p')).toBe(0);
    expect(num({ n: 12 }, 'n', 'p')).toBe(12);
    for (const v of ['3', NaN, Infinity, null]) {
      expect(errorDe(() => num({ n: v }, 'n', 'data.totales')).path).toBe('data.totales.n');
    }
  });

  it('nullableNum: acepta número o null; texto lanza', () => {
    expect(nullableNum({ n: 4 }, 'n', 'p')).toBe(4);
    expect(nullableNum({ n: null }, 'n', 'p')).toBeNull();
    expect(errorDe(() => nullableNum({ n: '4' }, 'n', 'p')).expected).toBe('number | null');
  });

  it('bool: acepta booleano; "true" lanza', () => {
    expect(bool({ b: false }, 'b', 'p')).toBeFalse();
    expect(errorDe(() => bool({ b: 'true' }, 'b', 'p')).expected).toBe('boolean');
  });

  it('idValue: acepta string o number; null u objeto lanzan', () => {
    expect(idValue({ id: 7 }, 'id', 'p')).toBe(7);
    expect(idValue({ id: '7' }, 'id', 'p')).toBe('7');
    for (const v of [null, { id: 1 }, NaN, undefined]) {
      expect(errorDe(() => idValue({ id: v }, 'id', 'p')).expected).toBe('string | number');
    }
  });

  it('oneOf: acepta un valor permitido; otro valor o un tipo distinto lanzan con la lista', () => {
    const vals = ['A', 'B'] as const;
    expect(oneOf({ k: 'B' }, 'k', 'p', vals)).toBe('B');
    for (const v of ['C', 'a', null, 1]) {
      const e = errorDe(() => oneOf({ k: v }, 'k', 'data.items[2]', vals));
      expect([e.path, e.expected]).toEqual(['data.items[2].k', "'A' | 'B'"]);
    }
  });

  it('stripTransportEnvelope: quita solo la capa externa del doble envoltorio', () => {
    const interno = { statusCode: 200, message: 'ok', data: { x: 1 } };
    expect(stripTransportEnvelope({ statusCode: 200, message: 'ok', data: interno })).toBe(interno);
    expect(stripTransportEnvelope(interno)).toBe(interno);
    expect(stripTransportEnvelope([1])).toEqual([1]);
    expect(stripTransportEnvelope(null)).toBeNull();
  });

  it('unwrapData: devuelve data; sin data lanza', () => {
    expect(unwrapData({ data: { x: 1 } })).toEqual({ x: 1 });
    expect(unwrapData({ data: null })).toBeNull();
    expect(errorDe(() => unwrapData({ statusCode: 200 })).path).toBe('response.data');
    expect(errorDe(() => unwrapData('x')).path).toBe('response');
  });
});

describe('safeHttpUrl (F01 T01-4, spec-ui §7.3)', () => {
  it('acepta https:// y http:// tal cual llegan', () => {
    expect(safeHttpUrl('https://meet.example.test/ceish')).toBe('https://meet.example.test/ceish');
    expect(safeHttpUrl('http://sala.example.test/reunion?id=3')).toBe(
      'http://sala.example.test/reunion?id=3',
    );
  });

  it('javascript:, data:, ftp:, texto que no es URL y cadena vacía → null', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeHttpUrl('ftp://archivos.example.test/acta.pdf')).toBeNull();
    expect(safeHttpUrl('sala 3')).toBeNull();
    expect(safeHttpUrl('')).toBeNull();
  });

  it('un valor que no es string → null', () => {
    expect(safeHttpUrl(null)).toBeNull();
    expect(safeHttpUrl(42)).toBeNull();
    expect(safeHttpUrl({ href: 'https://meet.example.test' })).toBeNull();
  });
});
