import { paths } from './api.types';
import { v4 as uuidv4 } from 'uuid';

export const createApiClient = (baseUrl: string) => {
  return async <T extends keyof paths, M extends keyof paths[T]>(
    path: T,
    method: M,
    options?: RequestInit
  ) => {
    const correlationId = uuidv4();
    const headers = {
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId,
      ...options?.headers,
    };

    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      method: method as string,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  };
};
