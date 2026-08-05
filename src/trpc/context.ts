import * as trpcExpress from '@trpc/server/adapters/express';
import { prisma } from '../shared/database';

export const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => {
    return {
        prisma,
        req,
        res,
    };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
