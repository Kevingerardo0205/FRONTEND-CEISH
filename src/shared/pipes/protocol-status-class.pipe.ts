import { Pipe, PipeTransform } from '@angular/core';
import { ProtocolUI } from '@shared/utils/protocol-ui.util';

@Pipe({
  name: 'protocolStatusClass',
  standalone: true,
  pure: true
})
export class ProtocolStatusClassPipe implements PipeTransform {
  transform(value: string | undefined): string {
    return ProtocolUI.class(value);
  }
}
