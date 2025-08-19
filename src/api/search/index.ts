import type { ApiMessage } from '../types';
import { SearchCoreIPC } from './searchCoreIPC';

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

    // Send to search core via type-safe wrapper
    SearchCoreIPC.sendMessage(event.data);
  });

  // Listen for messages from search core via type-safe wrapper
  SearchCoreIPC.onMessage((message) => {
    // eslint-disable-next-line no-console
    console.log('message from search core', message);

    // Forward to worker
    worker.postMessage(message);
  });

  worker.addEventListener('error', (event) => {
    // eslint-disable-next-line no-console
    console.log('error from search worker', event);
  });
}

export function processMessages(messages: ApiMessage[]) {
  // Validate input
  if (!Array.isArray(messages) || messages.length === 0) {
    console.warn('Invalid messages array provided to processMessages');
    return;
  }

  // Use type-safe wrapper - much cleaner!
  SearchCoreIPC.processMessages(messages);
}

export function searchMessages(params: { chatId: string; content: string }): Promise<ApiMessage[]> {
  // Use type-safe wrapper with built-in promise handling
  return SearchCoreIPC.searchMessages(params);
}
