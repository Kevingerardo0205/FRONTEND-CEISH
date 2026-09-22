export enum CallSessionType {
  ORDINARIA = 'ORDINARIA',
  EXTRAORDINARIA = 'EXTRAORDINARIA',
}

export interface ScheduledProtocol {
  id: number;
  ceishCode: string;
  title: string;
  investigatorName: string;
  versionNumber?: number;
  type?: string;
}

export class CallEntity {
  constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly date: Date,
    public readonly time: string,
    public readonly placeId: number | undefined,
    public readonly placeName: string,
    public readonly sessionType: CallSessionType,
    public readonly statusId: number,
    public readonly agendaSummary?: string,
    public readonly createdByUserId?: number,
    public readonly protocols: ScheduledProtocol[] = []
  ) {}

  get formattedDate(): string {
    return this.date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  get isFinalized(): boolean {
    return this.statusId === 24;
  }
}
