import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../src/trpc/routers/_app';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:8080/api/trpc',
      headers() {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
