import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProtocolFormComponent } from '../presentation/pages/protocol-form/protocol-form.component';

@Component({
  selector: 'app-protocol-create',
  standalone: true,
  imports: [CommonModule, ProtocolFormComponent],
  template: `
    <div class="create-page">
      <app-protocol-form></app-protocol-form>
    </div>
  `,
  styles: [`
    .create-page { padding: 2rem; }
  `]
})
export class ProtocolCreatePage {}
