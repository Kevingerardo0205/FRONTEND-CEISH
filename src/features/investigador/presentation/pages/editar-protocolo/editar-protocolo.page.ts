import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProtocoloService } from '../../../application/services/protocolo.service';
import { CrearProtocoloDto, InvestigadorEquipo, InstitucionParticipante } from '../../../domain/dtos/crear-protocolo.dto';
import { ecuadorianPhoneValidator, ecuadorianIdValidator } from '../nuevo-protocolo/nuevo-protocolo.page';

@Component({
  selector: 'app-editar-protocolo',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatCardModule, MatCheckboxModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatDividerModule, MatToolbarModule, MatTooltipModule
  ],
  templateUrl: './editar-protocolo.page.html',
  styleUrls: ['./editar-protocolo.page.scss']
})
export class EditarProtocoloPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly protocoloService = inject(ProtocoloService);

  isLoading = false;
  isSaving = false;
  protocolId!: number;
  protocoloOriginal: any = null;

  nivelesRiesgo: any[] = [];
  readonly coberturas = [
    { value: 'LOCAL', label: 'Local (Cantonal)' },
    { value: 'PROVINCIAL', label: 'Provincial' },
    { value: 'ZONAL', label: 'Zonal / Regional' },
    { value: 'NACIONAL', label: 'Nacional' }
  ];
  readonly funcionesEquipo = ['Investigador Principal', 'Coinvestigador', 'Tutor / Director', 'Asistente de Investigación', 'Estudiante'];

  editForm = this.fb.group({
    riskLevelId: [null as number | null],
    geographicCoverage: ['' as string | null],
    studyDurationMonths: [null as number | null, [Validators.min(1), Validators.max(120)]],
    lugarEjecucion: [''],
    fechaInicioEstimada: [''],
    fechaFinEstimada: [''],
    
    // Patrocinio
    sponsorRuc: ['', ecuadorianIdValidator],
    sponsorPhone: ['', ecuadorianPhoneValidator],
    sponsorAddress: [''],
    sponsorWeb: [''],
    sponsorExecutingAgency: [''],
    financingAmount: [0, [Validators.min(0)]],

    // Colecciones
    investigators: this.fb.array([]),
    institutions: this.fb.array([])
  });

  get investigators() { return this.editForm.get('investigators') as FormArray; }
  get institutions() { return this.editForm.get('institutions') as FormArray; }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.snackBar.open('ID de protocolo no válido', 'Cerrar');
      this.router.navigate(['/investigador/mis-protocolos']);
      return;
    }

    this.protocolId = Number(idParam);
    this.loadRiskLevels();
    this.loadProtocolDetails();
  }

  private loadRiskLevels() {
    this.protocoloService.getRiskLevels().subscribe({
      next: (levels: any) => {
        this.nivelesRiesgo = Array.isArray(levels) ? levels : (levels?.data || []);
      }
    });
  }

  private loadProtocolDetails() {
    this.isLoading = true;
    this.protocoloService.obtenerProtocolo(this.protocolId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const data = res?.data || res;
        this.protocoloOriginal = data;

        // Formatear fechas para los inputs date de HTML
        const formatDate = (dateStr: string) => {
          if (!dateStr) return '';
          return dateStr.split('T')[0];
        };

        // Rellenar campos simples
        this.editForm.patchValue({
          riskLevelId: data.riskLevel?.id || data.riskLevelId,
          geographicCoverage: data.geographicCoverage,
          studyDurationMonths: data.studyDurationMonths,
          lugarEjecucion: data.lugarEjecucion,
          fechaInicioEstimada: formatDate(data.fechaInicioEstimada),
          fechaFinEstimada: formatDate(data.fechaFinEstimada),
          sponsorRuc: data.sponsorRuc,
          sponsorPhone: data.sponsorPhone,
          sponsorAddress: data.sponsorAddress,
          sponsorWeb: data.sponsorWeb,
          sponsorExecutingAgency: data.sponsorExecutingAgency || data.executingOrgan,
          financingAmount: data.financingAmount || data.amount || 0
        });

        // Rellenar investigadores
        if (data.investigators && Array.isArray(data.investigators)) {
          data.investigators.forEach((inv: any) => {
            this.investigators.push(this.fb.group({
              funcion: [inv.position || '', Validators.required],
              nombreCompleto: [inv.fullName || '', [Validators.required, Validators.minLength(5)]],
              cedula: [inv.identification || '', [Validators.required, ecuadorianIdValidator]],
              formacion: [inv.education || '', Validators.required],
              entidad: [inv.institution || '', Validators.required],
              correo: [inv.email || '', [Validators.required, Validators.email]],
              celular: [inv.phone || '', [Validators.required, ecuadorianPhoneValidator]]
            }));
          });
        }

        // Rellenar instituciones
        if (data.institutions && Array.isArray(data.institutions)) {
          data.institutions.forEach((inst: any) => {
            this.institutions.push(this.fb.group({
              nombre: [inst.name || '', Validators.required],
              tipo: [inst.type === 'PUBLIC' ? 'PUBLICA' : 'PRIVADA', Validators.required],
              direccion: [inst.address || '', Validators.required],
              contacto: [inst.contactPerson || '', Validators.required]
            }));
          });
        }
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Error al cargar la información del protocolo.', 'Cerrar');
        this.router.navigate(['/investigador/mis-protocolos']);
      }
    });
  }

  addMiembro() {
    this.investigators.push(this.fb.group({
      funcion: ['', Validators.required],
      nombreCompleto: ['', [Validators.required, Validators.minLength(5)]],
      cedula: ['', [Validators.required, ecuadorianIdValidator]],
      formacion: ['', Validators.required],
      entidad: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, ecuadorianPhoneValidator]]
    }));
  }

  removeMiembro(index: number) {
    this.investigators.removeAt(index);
  }

  addInstitucion() {
    this.institutions.push(this.fb.group({
      nombre: ['', Validators.required],
      tipo: ['PUBLICA', Validators.required],
      direccion: ['', Validators.required],
      contacto: ['', Validators.required]
    }));
  }

  removeInstitucion(index: number) {
    this.institutions.removeAt(index);
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.snackBar.open('Existen errores en el formulario. Verifique e intente nuevamente.', 'Cerrar');
      return;
    }

    this.isSaving = true;
    const formVal = this.editForm.getRawValue();

    const payload: Partial<CrearProtocoloDto> = {
      riskLevelId: formVal.riskLevelId ? Number(formVal.riskLevelId) : null as any,
      geographicCoverage: formVal.geographicCoverage!,
      studyDurationMonths: formVal.studyDurationMonths ? Number(formVal.studyDurationMonths) : null as any,
      lugarEjecucion: formVal.lugarEjecucion!,
      fechaInicioEstimada: formVal.fechaInicioEstimada || undefined,
      fechaFinEstimada: formVal.fechaFinEstimada || undefined,
      
      sponsorRuc: formVal.sponsorRuc!,
      sponsorPhone: formVal.sponsorPhone!,
      sponsorAddress: formVal.sponsorAddress!,
      sponsorWeb: formVal.sponsorWeb || '',
      sponsorExecutingAgency: formVal.sponsorExecutingAgency!,
      financingAmount: Number(formVal.financingAmount),
      
      investigators: this.investigators.getRawValue().map(inv => ({
        fullName: inv.nombreCompleto,
        identification: inv.cedula,
        position: inv.funcion,
        institution: inv.entidad,
        email: inv.correo,
        phone: inv.celular,
        education: inv.formacion,
        role: 'CO_INVESTIGADOR'
      })),
      
      institutions: this.institutions.getRawValue().map(inst => ({
        name: inst.nombre,
        type: inst.tipo === 'PUBLICA' ? 'PUBLIC' : 'PRIVATE',
        address: inst.direccion,
        contactPerson: inst.contacto
      }))
    };

    // Agregar campos base requeridos para no perder información
    if (this.protocoloOriginal) {
      payload.title = this.protocoloOriginal.title;
      payload.studyTypeId = this.protocoloOriginal.studyType?.id || this.protocoloOriginal.studyTypeId;
      payload.principalInvestigatorId = this.protocoloOriginal.principalInvestigatorId;
      payload.usesBiologicalSamples = this.protocoloOriginal.usesBiologicalSamples;
      payload.isVulnerablePopulation = this.protocoloOriginal.isVulnerablePopulation;
      payload.isIndigenousPopulation = this.protocoloOriginal.isIndigenousPopulation;
      payload.isMulticentric = this.protocoloOriginal.isMulticentric;
      payload.hasExternalInstitutions = this.protocoloOriginal.hasExternalInstitutions;
      payload.isAffidavitAccepted = this.protocoloOriginal.isAffidavitAccepted;
    }

    this.protocoloService.actualizarProtocolo(this.protocolId, payload as CrearProtocoloDto).subscribe({
      next: () => {
        this.isSaving = false;
        this.snackBar.open('✅ Protocolo actualizado exitosamente.', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/dashboard/protocols/workspace', this.protocolId, 'info']);
      },
      error: (err) => {
        this.isSaving = false;
        this.snackBar.open('❌ Error al actualizar: ' + (err.message || 'Error interno'), 'Cerrar');
      }
    });
  }

  onKeyPressNumber(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) event.preventDefault();
  }
}
