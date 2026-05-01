import { ProtocolType } from '../enums/protocol-type.enum';

export class ProtocolCode {
  private constructor(private readonly value: string) {}

  static create(type: ProtocolType, sequence: number, year: number = new Date().getFullYear()): ProtocolCode {
    const paddedSequence = sequence.toString().padStart(3, '0');
    const code = `CEISH-ESPOCH-${type}-${paddedSequence}-${year}`;
    return new ProtocolCode(code);
  }

  getValue(): string {
    return this.value;
  }
}
