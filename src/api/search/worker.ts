// eslint-disable-next-line no-console
console.log('>>> SEARCH WORKER');

// Keep track of registered events
const registeredEvents = new Set<string>();

// Initialize by registering for search events
registeredEvents.add('storage:search:messages:data');

// Send registration message to main thread
self.postMessage({
  type: 'server:event:register',
  data: { event: 'storage:search:messages:data' },
});

// Handle messages from main thread (which come from search core via IPC)
self.onmessage = (event) => {
  const message = event.data;

  // eslint-disable-next-line no-console
  console.log('>>> message received in worker from main thread', message);

  // Check if this is a response from search core
  if (message.type && registeredEvents.has(message.type)) {
    // Forward the response back to main thread
    self.postMessage(message);
  } else if (message.type) {
    // This is a request from main thread to search core
    // Forward it to main thread which will send via IPC
    self.postMessage(message);
  }
};
