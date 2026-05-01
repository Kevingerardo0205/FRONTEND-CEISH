import { ProtocolType } from '@domain/enums/protocol-type.enum';
import { ValidationStrategy } from './validation.strategy';
import { IoValidationStrategy } from './io-validation.strategy';
import { EiValidationStrategy } from './ei-validation.strategy';
import { EcValidationStrategy } from './ec-validation.strategy';

export class ValidationContext {
  private strategies: ValidationStrategy[] = [
    new IoValidationStrategy(),
    new EiValidationStrategy(),
    new EcValidationStrategy()
  ];

  getStrategy(type: ProtocolType): ValidationStrategy {
    const strategy = this.strategies.find(s => s.type === type);
    if (!strategy) throw new Error(`Estrategia no encontrada para el tipo: ${type}`);
    return strategy;
  }
}
