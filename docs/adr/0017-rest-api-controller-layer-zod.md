# ADR 0017: REST API Controller Layer, Zod Validation, and Automated OpenAPI Generation

## Status
Accepted

## Context
Our current approach lacks a standardized way to handle HTTP requests, validate input data, and generate up-to-date API documentation. To ensure maintainability and consistency within our modular monolith, we need a robust solution that enforces strict input validation and provides developers with automated API specifications.

## Decision
We will implement a standardized REST API controller pattern using the following technologies:
- **Express**: As the web server framework.
- **Zod**: For defining request payload, query, and path parameter schemas.
- **`@asteasolutions/zod-to-openapi`**: For generating OpenAPI specifications directly from Zod schemas.
- **Centralized Validation Middleware**: A middleware that utilizes Zod for validation, supports schema transformations (e.g., stripping unknown fields, casting), and handles error formatting.

## Consequences
- **Positive**: 
  - Single source of truth for validation and documentation.
  - Consistent error responses across all API endpoints.
  - Automatic OpenAPI/Swagger generation ensures documentation stays in sync with code.
  - Enhanced type safety when accessing validated request data.
- **Negative**:
  - Adds dependencies (`zod`, `@asteasolutions/zod-to-openapi`).
  - Developers need to learn and follow the schema-first validation pattern.
