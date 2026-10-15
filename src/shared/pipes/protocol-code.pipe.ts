import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'protocolCode',
  standalone: true
})
export class ProtocolCodePipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value) return 'S/C';
    // Ejemplo: PRT-2024-001
    return value.toUpperCase();
  }
}
