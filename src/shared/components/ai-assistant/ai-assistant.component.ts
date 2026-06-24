import { Component, OnInit, OnDestroy, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription, filter } from 'rxjs';
import { IAiAssistantRepositoryPort, ChatHistoryItem } from '@domain/ports/IAiAssistantRepositoryPort';
import { AiAssistantSharedService } from './ai-assistant-shared.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss']
})
export class AiAssistantComponent implements OnInit, OnDestroy {
  private readonly aiAssistantRepository = inject(IAiAssistantRepositoryPort);
  private readonly router = inject(Router);
  private readonly sharedService = inject(AiAssistantSharedService);

  @ViewChild('chatMessagesContainer') private chatMessagesContainer!: ElementRef;

  // UI State Signals
  isOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  userMessage = signal<string>('');
  
  // Conversación
  messages = signal<Array<{ sender: 'user' | 'assistant'; content: string; parsedContent: string }>>([]);
  
  // Protocol ID activo (detectado de la URL)
  activeProtocolId = signal<number | undefined>(undefined);

  private routerSubscription!: Subscription;
  private clearChatSubscription!: Subscription;

  // Sugerencias rápidas de consulta
  quickPrompts = computed(() => {
    const hasProtocol = this.activeProtocolId() !== undefined;
    if (hasProtocol) {
      return [
        { label: '¿Qué documentos faltan en este protocolo?', query: '¿Qué documentos faltan subir o están pendientes en este protocolo?' },
        { label: 'Verificar requisitos del PET', query: '¿Cuáles son los requisitos obligatorios generales según la normativa PET?' },
        { label: 'Historial de versiones del protocolo', query: '¿Cuál es el historial de versiones y estado actual de este protocolo?' }
      ];
    } else {
      return [
        { label: '¿Qué es el reglamento PET?', query: '¿Qué es el reglamento PET y cuál es su objetivo?' },
        { label: 'Requisitos para Ensayos Clínicos', query: '¿Cuáles son los requisitos específicos para la evaluación de Ensayos Clínicos (EC)?' },
        { label: 'Procedimiento para evaluación de protocolos', query: '¿Cuál es el procedimiento paso a paso para la evaluación de protocolos de investigación?' }
      ];
    }
  });

  ngOnInit() {
    this.detectProtocolIdFromUrl();
    
    // Escuchar cambios de ruta para actualizar el protocolId dinámicamente
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.detectProtocolIdFromUrl();
    });

    // Suscribirse a eventos externos de limpieza de chat (ej: cuando el administrador cambia el PDF)
    this.clearChatSubscription = this.sharedService.clearChat$.subscribe(() => {
      this.resetChat();
    });

    // Mensaje de bienvenida inicial
    this.addAssistantMessage(
      '¡Hola! Soy tu **Asistente de IA de CEISH-ESPOCH**. Estoy aquí para ayudarte a consultar el reglamento PET, verificar las versiones de tus protocolos o revisar el checklist de documentos. ¿En qué puedo ayudarte hoy?'
    );
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.clearChatSubscription) {
      this.clearChatSubscription.unsubscribe();
    }
  }

  resetChat() {
    this.messages.set([]);
    this.addAssistantMessage(
      '¡Hola! Soy tu **Asistente de IA de CEISH-ESPOCH**. Estoy aquí para ayudarte a consultar el reglamento PET, verificar las versiones de tus protocolos o revisar el checklist de documentos. ¿En qué puedo ayudarte hoy?'
    );
  }


  toggleOpen() {
    this.isOpen.update(open => !open);
    if (this.isOpen()) {
      this.scrollToBottom();
    }
  }

  private detectProtocolIdFromUrl() {
    const url = this.router.url;
    // Captura el ID de /workspace/:id/info o rutas similares
    const match = url.match(/\/workspace\/(\d+)/);
    if (match) {
      const id = parseInt(match[1], 10);
      if (this.activeProtocolId() !== id) {
        this.activeProtocolId.set(id);
        // Opcional: Reiniciar chat o añadir mensaje de cambio de contexto
        this.loggerLog(`Asistente IA enfocado en el protocolo ID: ${id}`);
      }
    } else {
      this.activeProtocolId.set(undefined);
    }
  }

  sendMessage(text?: string) {
    const query = text || this.userMessage().trim();
    if (!query || this.isLoading()) return;

    // Agregar mensaje del usuario a la pantalla
    this.messages.update(list => [
      ...list,
      { sender: 'user', content: query, parsedContent: query }
    ]);
    
    if (!text) {
      this.userMessage.set('');
    }

    this.isLoading.set(true);
    this.scrollToBottom();

    // Preparar el historial en el formato que espera el Backend
    const historyPayload: ChatHistoryItem[] = this.messages()
      .slice(0, -1) // Excluir el último mensaje que acabamos de agregar
      .map(msg => ({
        role: msg.sender === 'assistant' ? 'model' : 'user',
        content: msg.content
      }));

    this.aiAssistantRepository.chat(
      query,
      this.activeProtocolId(),
      historyPayload
    ).subscribe({
      next: (res) => {
        this.addAssistantMessage(res.response);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        let errorMsg = 'Lo siento, ocurrió un problema al conectar con el servidor de IA.';
        if (err.status === 502 || err.status === 429) {
          errorMsg = 'Límite de solicitudes de IA excedido (429) o servicio temporalmente no disponible (502). Por favor, intenta de nuevo en unos momentos.';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.message) {
          errorMsg = err.message;
        }
        this.addAssistantMessage(`⚠️ *${errorMsg}*`);
        this.isLoading.set(false);
        this.scrollToBottom();
      }
    });
  }

  private addAssistantMessage(text: string) {
    const parsed = this.parseMarkdown(text);
    this.messages.update(list => [
      ...list,
      { sender: 'assistant', content: text, parsedContent: parsed }
    ]);
  }

  private scrollToBottom() {
    setTimeout(() => {
      try {
        if (this.chatMessagesContainer) {
          const element = this.chatMessagesContainer.nativeElement;
          element.scrollTop = element.scrollHeight;
        }
      } catch (err) {}
    }, 100);
  }

  /**
   * Conversor básico y seguro de Markdown a HTML
   */
  private parseMarkdown(text: string): string {
    if (!text) return '';
    
    // Escapar HTML básico para prevenir XSS
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Convertir cabeceras ### y ##
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Negrita (**texto**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Cursiva (*texto*)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Bloques de código (```codigo```)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Código en línea (`codigo`)
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Listas desordenadas (- item)
    html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
    
    // Reemplazar saltos de línea por <br/>
    html = html.replace(/\n/g, '<br/>');

    return html;
  }

  private loggerLog(msg: string) {
    console.log(`[AiAssistantComponent] ${msg}`);
  }
}
