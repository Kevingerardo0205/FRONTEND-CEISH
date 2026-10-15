import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProfileCvService } from './profile-cv.service';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';

describe('ProfileCvService', () => {
  let service: ProfileCvService;
  let storageSpy: jasmine.SpyObj<S3StorageService>;

  beforeEach(() => {
    storageSpy = jasmine.createSpyObj<S3StorageService>('S3StorageService', [
      'getUploadUrl',
      'uploadFileToS3',
      'getEvaluationDocumentUrl',
    ]);
    TestBed.configureTestingModule({
      providers: [ProfileCvService, { provide: S3StorageService, useValue: storageSpy }],
    });
    service = TestBed.inject(ProfileCvService);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('rechaza archivos que no son PDF sin solicitar una URL firmada', (done) => {
    const file = new File(['contenido'], 'cv.txt', { type: 'text/plain' });
    service.uploadCv(file, 'investigador-1').subscribe({
      next: () => fail('La carga no debía completarse'),
      error: (error) => {
        expect(error.message).toContain('formato PDF');
        expect(storageSpy.getUploadUrl).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('rechaza archivos PDF que superan 5 MB', (done) => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'cv.pdf', {
      type: 'application/pdf',
    });
    service.uploadCv(file, 'investigador-1').subscribe({
      next: () => fail('La carga no debía completarse'),
      error: (error) => {
        expect(error.message).toContain('5 MB');
        expect(storageSpy.getUploadUrl).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('rechaza archivos PDF vacíos', (done) => {
    const file = new File([], 'cv-vacio.pdf', { type: 'application/pdf' });
    service.uploadCv(file, 'investigador-1').subscribe({
      next: () => fail('La carga no debía completarse'),
      error: (error) => {
        expect(error.message).toContain('no puede estar vacío');
        expect(storageSpy.getUploadUrl).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('sube el binario mediante URL firmada y persiste únicamente sus metadatos', (done) => {
    const file = new File(['%PDF-1.7'], 'CV Investigador.pdf', { type: 'application/pdf' });
    storageSpy.getUploadUrl.and.returnValue(
      of({
        uploadUrl: 'https://storage.example/upload',
        key: 'investigators/investigador-1/cv/cv-investigador.pdf',
      }),
    );
    storageSpy.uploadFileToS3.and.returnValue(of({ progress: 100, success: true }));

    service.uploadCv(file, 'investigador-1').subscribe((metadata) => {
      expect(storageSpy.getUploadUrl).toHaveBeenCalledWith(
        jasmine.stringMatching(/^investigators\/investigador-1\/cv\//),
        'application/pdf',
      );
      expect(storageSpy.uploadFileToS3).toHaveBeenCalledWith(
        'https://storage.example/upload',
        file,
      );
      expect(service.getStoredCv('investigador-1')).toEqual(metadata);
      expect(localStorage.getItem('ceish_investigator_cv_data')).toBeNull();
      done();
    });
  });

  it('elimina datos Base64 heredados al consultar el CV', () => {
    localStorage.setItem('ceish_investigator_cv_data', 'data:application/pdf;base64,abc');
    localStorage.setItem('ceish_investigator_cv_name', 'CV anterior.pdf');
    expect(service.getStoredCv('investigador-1')).toBeNull();
    expect(localStorage.getItem('ceish_investigator_cv_data')).toBeNull();
    expect(localStorage.getItem('ceish_investigator_cv_name')).toBeNull();
  });

  it('descarta metadatos corruptos para evitar descargar claves no válidas', () => {
    localStorage.setItem('ceish_investigator_cv_metadata_investigador-1', '{invalido');

    expect(service.getStoredCv('investigador-1')).toBeNull();
    expect(localStorage.getItem('ceish_investigator_cv_metadata_investigador-1')).toBeNull();
  });

  it('descarta metadatos incompletos para evitar descargar claves no válidas', () => {
    localStorage.setItem(
      'ceish_investigator_cv_metadata_investigador-1',
      JSON.stringify({
        fileName: 'cv.pdf',
        uploadedAt: '2026-01-01T00:00:00.000Z',
      }),
    );

    expect(service.getStoredCv('investigador-1')).toBeNull();
    expect(localStorage.getItem('ceish_investigator_cv_metadata_investigador-1')).toBeNull();
  });

  it('exige nombre, fecha y clave remota en los metadatos', () => {
    const metadataIncompleta = [
      { storageKey: 'cv.pdf', uploadedAt: '2026-01-01T00:00:00.000Z' },
      { fileName: 'cv.pdf', uploadedAt: '2026-01-01T00:00:00.000Z' },
      { fileName: 'cv.pdf', storageKey: 'cv.pdf' },
    ];

    metadataIncompleta.forEach((metadata, index) => {
      const investigatorId = `investigador-${index}`;
      localStorage.setItem(
        `ceish_investigator_cv_metadata_${investigatorId}`,
        JSON.stringify(metadata),
      );

      expect(service.getStoredCv(investigatorId)).toBeNull();
      expect(localStorage.getItem(`ceish_investigator_cv_metadata_${investigatorId}`)).toBeNull();
    });
  });

  it('elimina solamente los metadatos del CV del investigador actual', () => {
    localStorage.setItem(
      'ceish_investigator_cv_metadata_investigador-1',
      JSON.stringify({
        fileName: 'cv.pdf',
        sizeBytes: 100,
        sizeLabel: '1 KB',
        uploadedAt: '2026-01-01T00:00:00.000Z',
        storageKey: 'investigators/investigador-1/cv/cv.pdf',
      }),
    );
    localStorage.setItem('ceish_investigator_cv_metadata_investigador-2', 'conservar');

    service.deleteStoredCv('investigador-1');

    expect(localStorage.getItem('ceish_investigator_cv_metadata_investigador-1')).toBeNull();
    expect(localStorage.getItem('ceish_investigator_cv_metadata_investigador-2')).toBe('conservar');
  });

  it('formatea archivos de un megabyte en MB al guardar metadatos', (done) => {
    const file = new File([new Uint8Array(1024 * 1024)], 'cv.pdf', { type: 'application/pdf' });
    storageSpy.getUploadUrl.and.returnValue(
      of({ uploadUrl: 'https://storage.example/upload', key: 'cv.pdf' }),
    );
    storageSpy.uploadFileToS3.and.returnValue(of({ progress: 100, success: true }));

    service.uploadCv(file, 'investigador-1').subscribe((metadata) => {
      expect(metadata.sizeLabel).toBe('1.00 MB');
      done();
    });
  });

  it('no guarda metadatos si el almacenamiento no confirma la carga', (done) => {
    const file = new File(['%PDF-1.7'], 'cv.pdf', { type: 'application/pdf' });
    storageSpy.getUploadUrl.and.returnValue(
      of({ uploadUrl: 'https://storage.example/upload', key: 'cv.pdf' }),
    );
    storageSpy.uploadFileToS3.and.returnValue(of({ progress: 50, success: false }));

    service.uploadCv(file, 'investigador-1').subscribe({
      next: () => fail('No debía emitir un CV sin confirmación de carga'),
      complete: () => {
        expect(service.getStoredCv('investigador-1')).toBeNull();
        done();
      },
    });
  });

  it('obtiene la URL temporal de descarga desde el servicio de almacenamiento', (done) => {
    storageSpy.getEvaluationDocumentUrl.and.returnValue(
      of({
        downloadUrl: 'https://storage.example/download?signature=temporal',
      }),
    );
    service.getDownloadUrl('investigators/investigador-1/cv/cv.pdf').subscribe((downloadUrl) => {
      expect(downloadUrl).toContain('signature=temporal');
      expect(storageSpy.getEvaluationDocumentUrl).toHaveBeenCalledWith(
        'investigators/investigador-1/cv/cv.pdf',
      );
      done();
    });
  });
});
