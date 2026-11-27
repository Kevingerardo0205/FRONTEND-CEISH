import { REQUISITOS_DOCUMENTOS } from './anexos-pet.constants';

describe('REQUISITOS_DOCUMENTOS: formatos (TSK-015-N24)', () => {
  it('todo requisito acepta solo PDF, sin Word', () => {
    const conFormatos = REQUISITOS_DOCUMENTOS.filter((r) => r.formatosAceptados !== undefined);

    expect(conFormatos.length).toBeGreaterThan(0);
    for (const requisito of conFormatos) {
      expect(requisito.formatosAceptados)
        .withContext(requisito.id)
        .toEqual(['application/pdf']);
    }
  });

  it('el Anexo 2 (formulario) ya no admite DOCX', () => {
    const anexo2 = REQUISITOS_DOCUMENTOS.find((r) => r.id === 'anexo2_formulario');

    expect(anexo2?.formatosAceptados).toEqual(['application/pdf']);
  });
});
