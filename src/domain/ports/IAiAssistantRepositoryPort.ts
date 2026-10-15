import { Observable } from 'rxjs';

export interface ChatHistoryItem {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export abstract class IAiAssistantRepositoryPort {
  abstract chat(
    message: string,
    protocolId?: number,
    history?: ChatHistoryItem[]
  ): Observable<{ response: string }>;

  abstract getAllowedRoles(): Observable<{ allowedRoles: string[] }>;
}
