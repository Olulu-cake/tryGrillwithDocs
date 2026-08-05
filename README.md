# E-Commerce System: Architecture Whitepaper

## Executive Summary & Tech Stack Overview
This repository defines a robust, high-performance E-Commerce platform designed for SMB scale, balancing simplicity with scalability. We utilize a **Modular Monolith** architecture to maintain rapid development velocity while avoiding the operational overhead of microservices.

### Tech Stack
- **Backend:** Node.js (TypeScript), Express.
- **Frontend:** Next.js (TypeScript).
- **Database:** PostgreSQL (with Prisma ORM).
- **Caching/Concurrency:** Redis (Cache-Aside, Mutex Stampede Guard).
- **Infrastructure:** Docker, Docker Compose, GitHub Actions.
- **Testing:** Vitest (unit/integration), k6 (load testing - 5,000 VUs).
- **API Design:** OpenAPI 3.0 / Swagger UI, Zod schema validation, auto-generated TypeScript SDK.

---

## Architecture Topology & ADR Summary
Our system architecture centers on strict domain boundaries.

### Architectural Decision Records (ADR)
| ID | Title | Summary |
| :--- | :--- | :--- |
| 0001 | Record Architecture Decisions | Formalize ADR workflow. |
| 0002 | Modular Monolith Architecture | Decoupled domain modules, unified deployment unit. |
| 0003 | Technology Stack | TypeScript/Node, PostgreSQL, Redis. |
| 0004 | Inventory Reservation Strategy | Optimistic locking for high-concurrency inventory management. |
| 0005 | Async Webhook Checkout | Decoupled checkout using event-driven architecture. |
| 0006 | Guest Checkout | Support for unauthenticated users. |
| 0007 | Payment Abstraction | Resilient payment gateway integration. |
| 0008 | Order Fulfillment/Shipping | Order lifecycle and shipping provider integration. |
| 0009 | Modular Database Schema | Logical schema separation within a single PostgreSQL instance. |
| 0010 | Integration Testing Strategy | Comprehensive integration testing for inter-module flows. |
| 0011 | Cart/Checkout API Design | RESTful design, Zod-based validation. |
| 0012 | Webhook Idempotency/Order State Machine | Robust state management for order lifecycle events. |
| 0013 | Webhook Reconciliation/Retries | Reliability pattern for carrier/payment callbacks. |
| 0014 | Observability/Tracing | AsyncLocalStorage-based distributed correlation IDs. |
| 0015 | Security Hardening | JWT Super-Scope RBAC, input sanitization. |
| 0016 | Reconciliation/State Guard/Tracing | Ensuring data integrity in distributed callback scenarios. |
| 0017 | REST API/Zod | Enterprise-grade input/output validation layer. |
| 0018 | Read Scalability/Caching | Redis Cache-Aside, Mutex stampede guard, negative caching. |

---

## High-Concurrency Cache Strategy (ADR-0018)
To achieve high throughput, we implement a layered approach in Redis:
1. **Cache-Aside Pattern**: Lazy loading for catalog data with jittered TTLs to prevent cache avalanches.
2. **Mutex Stampede Guard**: Distributed lock (`SET lock:product:{id} NX PX 2000`) prevents thundering herd issues during cache misses.
3. **Negative Caching**: Caches empty results for 30s to prevent database penetration by invalid requests.
4. **Active Eviction**: Proactive invalidation driven by domain events (e.g., `ProductUpdatedEvent`).

---

## API Gateway & End-to-End Type Safety
- **OpenAPI 3.0**: Centralized API definitions generated via Zod schemas. Swagger UI available at `/api-docs`.
- **Validation**: Strict Zod middleware ensures request payload integrity before domain logic execution.
- **Type Safety**: Auto-generated TypeScript client SDK (`src/shared/api.types.ts`) ensures strict contract adherence between frontend and backend.
- **Correlation**: `x-correlation-id` header is injected and propagated through all requests via `AsyncLocalStorage` for seamless distributed tracing.

---

## DevOps, CI/CD & Testing Infrastructure
- **Dockerfile**: Multi-stage build (`USER node`) for optimized, secure container images.
- **Docker Compose**: Production-like environment orchestration.
- **GitHub Actions**: Automated CI pipeline publishing secure images to GHCR.
- **Performance**: Integrated 5,000 VUs k6 load testing script to validate system capacity.

---

## Local Development & Quick Start Guide

### Prerequisites
- Node.js (LTS), Docker/Docker Compose.

### Setup
```bash
# Install dependencies
npm install

# Start development infrastructure (Postgres/Redis)
docker-compose up -d

# Run application
npm run dev

# Run tests
npm test

# Run k6 stress test
k6 run tests/load/k6-load-test.js
```

### API Documentation
After starting the application, visit the Swagger UI at `http://localhost:3000/api-docs`.
