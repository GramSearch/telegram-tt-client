import type { ApiMessage } from '../types';
import { ElectronEvent } from '../../types/electron';

let worker: Worker;
let isSearchInitialized = false;

export function initSearchWorker() {
  // eslint-disable-next-line no-console
  console.log('>>> INIT SEARCH WORKER');

  worker = new Worker(new URL('./worker.ts', import.meta.url));

  // Forward messages from worker to Electron IPC
  worker.addEventListener('message', (event) => {
    // First successful message indicates initialization
    if (!isSearchInitialized) {
      isSearchInitialized = true;
    }
    // eslint-disable-next-line no-console
    console.log('message from search worker', event.data);

    // Send to search core via Electron IPC
    if (window.electron) {
      window.electron.sendToSearchCore(event.data);
    }
  });

  // Listen for messages from search core via Electron IPC
  if (window.electron) {
    window.electron.on(ElectronEvent.SEARCH_CORE_MESSAGE, (message: any) => {
      // eslint-disable-next-line no-console
      console.log('message from search core', message);

      // Forward to worker
      worker.postMessage(message);
    });
  }

  worker.addEventListener('error', (event) => {
    // eslint-disable-next-line no-console
    console.log('error from search worker', event);
  });
}

export function processMessages(messages: ApiMessage[]) {
  // Guard against calling before initialization
  if (!worker || !isSearchInitialized) {
    console.warn('Search worker not initialized, skipping message processing');
    return;
  }

  // Validate input
  if (!Array.isArray(messages) || messages.length === 0) {
    console.warn('Invalid messages array provided to processMessages');
    return;
  }

  worker.postMessage({
    type: 'message:process',
    payload: { messages },
  });
}

export function searchMessages(params: { chatId: string; content: string }) {
  return new Promise((resolve) => {
    // Create a one-time listener for the search response
    const handleSearchResponse = (event: MessageEvent) => {
      const { type, data } = event.data as { type: string; data: any };

      if (type === 'storage:search:messages:data') {
        worker.removeEventListener('message', handleSearchResponse);
        resolve(data.messages);
      }
    };

    worker.addEventListener('message', handleSearchResponse);

    worker.postMessage({
      type: 'storage:search:messages',
      payload: {
        ...params,
        useVector: true,
      },
    });
  });
}
