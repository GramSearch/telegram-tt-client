import type { ApiMessage } from '../types';
import {
  ElectronEvent,
  type SearchCoreIPCMessage,
  type MessageProcessIPCPayload,
  type SearchMessagesIPCPayload
} from '../../types/electron';

/**
 * Type-safe wrapper for Search Core IPC communication
 */
export class SearchCoreIPC {
  private static isInitialized = false;

  /**
   * Send messages to search core for processing
   */
  static processMessages(messages: ApiMessage[]): void {
    if (!window.electron) {
      console.warn('Electron API not available');
      return;
    }

    const message: SearchCoreIPCMessage = {
      type: 'message:process',
      payload: { messages } satisfies MessageProcessIPCPayload,
    };

    window.electron.sendToSearchCore(message);
  }

  /**
   * Search messages with type-safe promise return
   */
  static searchMessages(params: { chatId: string; content: string }): Promise<ApiMessage[]> {
    return new Promise((resolve, reject) => {
      if (!window.electron) {
        reject(new Error('Electron API not available'));
        return;
      }

      // Set up one-time listener
      const cleanup = window.electron.on(ElectronEvent.SEARCH_CORE_MESSAGE, (message) => {
        if (message.type === 'storage:search:messages:data' && message.data) {
          cleanup(); // Remove listener
          const data = message.data as { messages: ApiMessage[] };
          resolve(data.messages);
        }
      });

      // Send search request
      const searchMessage: SearchCoreIPCMessage = {
        type: 'storage:search:messages',
        payload: {
          ...params,
          useVector: true,
        } satisfies SearchMessagesIPCPayload,
      };

      window.electron.sendToSearchCore(searchMessage);

      // Set timeout to cleanup if no response
      setTimeout(() => {
        cleanup();
        reject(new Error('Search request timeout'));
      }, 10000);
    });
  }

  /**
   * Generic listener for search core messages
   */
  static onMessage(callback: (message: SearchCoreIPCMessage) => void): () => void {
    if (!window.electron) {
      console.warn('Electron API not available');
      return () => {};
    }

    return window.electron.on(ElectronEvent.SEARCH_CORE_MESSAGE, callback);
  }

  /**
   * Send generic message to search core
   */
  static sendMessage(message: SearchCoreIPCMessage): void {
    if (!window.electron) {
      console.warn('Electron API not available');
      return;
    }

    window.electron.sendToSearchCore(message);
  }
}
