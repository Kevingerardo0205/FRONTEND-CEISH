import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiAssistantSharedService {
  private readonly clearChatSubject = new Subject<void>();

  /**
   * Observable to subscribe to chat clear events.
   */
  clearChat$ = this.clearChatSubject.asObservable();

  /**
   * Triggers a request to clear the AI assistant chat history.
   */
  clearChat(): void {
    this.clearChatSubject.next();
  }
}
