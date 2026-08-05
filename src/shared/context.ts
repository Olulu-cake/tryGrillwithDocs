import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  correlationId?: string;
  traceId?: string;
}

export const contextStorage = new AsyncLocalStorage<RequestContext>();

export function getCorrelationId(): string | undefined {
  return contextStorage.getStore()?.correlationId;
}
