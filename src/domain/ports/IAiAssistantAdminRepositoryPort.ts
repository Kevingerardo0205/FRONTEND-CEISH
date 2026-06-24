import { Observable } from 'rxjs';

export interface AiAssistantConfigSummary {
  petFileName: string;
  allowedRoles: string[];
  updatedAt: Date;
}

export abstract class IAiAssistantAdminRepositoryPort {
  abstract getConfig(): Observable<AiAssistantConfigSummary>;
  
  abstract uploadPet(
    file: File
  ): Observable<{ message: string; petFileName: string; characterCount: number }>;
  
  abstract updateRoles(
    allowedRoles: string[]
  ): Observable<{ message: string; allowedRoles: string[] }>;
}
