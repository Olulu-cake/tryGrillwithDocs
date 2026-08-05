# ADR 0002: Modular Monolith Architecture for SMB Scale

## Status
Proposed

## Context
We are designing an E-commerce system targeted at Small-to-Medium Business (SMB) scale:
- Up to 10,000 Daily Active Users (DAU)
- Approximately 100 to 500 orders per day
- Catalog size of fewer than 50,000 items

A highly distributed microservices architecture would introduce excessive operational complexity, high hosting costs, and distributed transaction challenges (e.g., Two-Phase Commit, Saga patterns) that are unnecessary at this scale.

## Decision
We will adopt a **Modular Monolith** architecture pattern.
- The entire system will run as a single deployment unit (monolith).
- However, the codebase will be organized into strictly decoupled, cohesive modules (e.g., `Catalog`, `Cart`, `Ordering`, `Inventory`, `Payment`).
- Modules will communicate via clean, explicit interfaces (in-process method calls or internal event buses), avoiding direct database sharing across modules where possible to allow future extraction into microservices if needed.
- We will use a single relational database (e.g., PostgreSQL 18) with logical schemas separating module data.

## Consequences
- **Positive**:
  - Extremely low operational and deployment overhead.
  - Strong transactional consistency (ACID) is trivial to achieve within a single database.
  - Faster development velocity and easier debugging.
  - Clear paths for scaling by upgrading server resources (vertical scaling) or running multiple stateless instances behind a load balancer.
- **Negative**:
  - The entire application must be redeployed for a change in any single module.
  - Potential for accidental module coupling if developers bypass module interfaces (requires automated linter/boundary checks).
- **Neutral**:
  - We must establish and enforce strict directory structure and module boundaries from day one.
