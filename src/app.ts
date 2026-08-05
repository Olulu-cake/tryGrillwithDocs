import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import session from 'express-session';
import 'dotenv/config';
import { getOpenApiSpec } from './shared/openapi';
import { adminRouter } from './admin.controller';
import { authRouter } from './modules/auth/auth.controller';
// 修正 1：改為 default import 匯入 catalogRouter
import catalogRouter from './modules/catalog/catalog.router';
import orderRouter from './modules/orders/order.router';
import { paymentsRouter } from './modules/payments/payments.controller';
import cartRouter from './modules/cart/cart.router';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './trpc';
import { createContext } from './trpc/context';

export const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (req.path.includes('/api/orders')) {
    console.log('===> [App Global Request]:', req.method, req.originalUrl);
    console.log('===> [App Global Headers]:', req.headers['content-type']);
    console.log('===> [App Global Body]:', JSON.stringify(req.body));
  }
  next();
});
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // 或依需求允許跨域
    }
  },
  credentials: true
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // 正式環境為 HTTPS (true)，開發環境為 HTTP (false)
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// tRPC
app.use(
  '/api/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Admin & Business Routes
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/products', catalogRouter); // 支援 /api/products/:id
app.use('/api/orders', orderRouter);
app.use('/api/orders/my-orders', orderRouter); // Alias for frontend compatibility
app.use('/api/payments', paymentsRouter);
app.use('/api/checkout', paymentsRouter); // Alias for frontend compatibility
app.use('/api/cart', cartRouter);

app.get('/', (req, res) => {
  res.send('Hello, my-app is running successfully!');
});

// OpenAPI docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(getOpenApiSpec()));
app.get('/api-docs.json', (req, res) => {
  res.json(getOpenApiSpec());
});

// 全域 404 JSON Catch-All
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found: ' + req.method + ' ' + req.originalUrl });
});

// 全域 500 Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Global Error]:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}