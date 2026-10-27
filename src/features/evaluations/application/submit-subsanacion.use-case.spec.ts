import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SubmitSubsanacionUseCase } from './submit-subsanacion.use-case';
import { ProtocoloService } from '@features/investigador/application/services/protocolo.service';

describe('SubmitSubsanacionUseCase', () => {
  let useCase: SubmitSubsanacionUseCase;
  let serviceSpy: jasmine.SpyObj<ProtocoloService>;

  beforeEach(() => {
    const sSpy = jasmine.createSpyObj('ProtocoloService', ['finalizarProtocolo']);
    TestBed.configureTestingModule({
      providers: [SubmitSubsanacionUseCase, { provide: ProtocoloService, useValue: sSpy }],
    });
    useCase = TestBed.inject(SubmitSubsanacionUseCase);
    serviceSpy = TestBed.inject(ProtocoloService) as jasmine.SpyObj<ProtocoloService>;
  });

  it('debe llamar finalizarProtocolo con el id correcto', (done) => {
    serviceSpy.finalizarProtocolo.and.returnValue(of({ message: 'OK', protocol: {} as any }));
    useCase.execute(42).subscribe({
      next: () => {
        expect(serviceSpy.finalizarProtocolo).toHaveBeenCalledWith(42);
        done();
      },
      error: fail,
    });
  });
});
