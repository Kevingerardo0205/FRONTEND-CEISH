import { Pipe, PipeTransform } from '@angular/core';
import { ProtocolUI } from '@shared/utils/protocol-ui.util';

@Pipe({
  name: 'protocolStatusLabel',
  standalone: true,
  pure: true
})
export class ProtocolStatusLabelPipe implements PipeTransform {
  transform(value: string | undefined): string {
    return ProtocolUI.label(value);
  }
}
