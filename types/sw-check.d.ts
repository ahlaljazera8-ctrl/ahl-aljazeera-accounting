// public/sw.js only. The WebWorker lib types `self` as a dedicated worker, so the
// service-worker fields this file uses are added here instead of in sw.js.
interface WorkerGlobalScope {
  skipWaiting(): Promise<void>;
  clients: Clients;
}

interface Event {
  waitUntil(promise: Promise<unknown>): void;
  respondWith(response: Promise<Response> | Response): void;
  readonly request: Request;
}
