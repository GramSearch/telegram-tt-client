import type { ApiMessage } from '../types';

let worker: Worker;

export function initSearchWorker() {
  // eslint-disable-next-line no-console
  console.log('>>> INIT SEARCH WORKER');

  worker = new Worker(new URL('./worker.ts', import.meta.url));

  worker.addEventListener('message', (event) => {
    // eslint-disable-next-line no-console
    console.log('message from search worker', event.data);
  });

  worker.addEventListener('error', (event) => {
    // eslint-disable-next-line no-console
    console.log('error from search worker', event);
  });
}

export function processMessages(messages: ApiMessage[]) {
  worker.postMessage({
    type: 'message:process',
    payload: { messages },
  });
}
