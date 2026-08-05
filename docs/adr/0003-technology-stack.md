# ADR 0003: Technology Stack - TypeScript, Node.js, and PostgreSQL 18

## Status
Proposed

## Context
For an SMB-scale modular monolith, we need a technology stack that supports:
- High developer productivity and rapid feature iteration.
- Strong type safety to maintain module boundaries.
- Excellent community support, libraries, and hosting options.
- Robust relational capabilities for transaction-heavy e-commerce actions (carts, orders, stock).

## Decision
We will use:
1. **TypeScript** as the programming language.
2. **Node.js** with **Express** or **NestJS** as the backend framework (structured as a modular monolith).
3. **PostgreSQL 18** as the primary relational database.
4. **Prisma ORM** or **Drizzle ORM** for type-safe database access and migrations.

## Consequences
- **Positive**:
  - JavaScript/TypeScript is universally known, simplifying talent acquisition and onboarding.
  - PostgreSQL 18 is incredibly reliable, supports ACID compliance out-of-the-box, and has excellent JSON support if we need unstructured data storage.
  - Modern TypeScript ORMs provide compile-time safety for database queries, preventing run-time schema mismatches.
- **Negative**:
  - Node.js is single-threaded, but for up to 10k DAU, vertical scaling or a simple load balancer is more than sufficient.
- **Neutral**:
  - We must establish clean database separation within PostgreSQL 18 (e.g., using separate schemas or prefixing tables per module) to prevent modules from direct querying of each other's tables.
