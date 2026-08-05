import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

export const registry = new OpenAPIRegistry();

export function getOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'E-Commerce API',
      description: 'Modular Monolith API Documentation',
    },
    servers: [{ url: process.env.FRONTEND_URL || 'http://localhost:3000' }],
  });
}
