# ADR 0014: Observability and Distributed Tracing Architecture

## Status
Proposed

## Context
Our system utilizes asynchronous event-driven patterns, making it difficult to debug order flows across service boundaries. We require a unified mechanism for correlation and structured logging to maintain observability in production.

## Decision
1. **Adopt Pino for Logging**: Replace all `console.*` calls with a standardized `pino` logger.
   - **Dependency Injection**: Use a pre-configured `pino` singleton with `child()` context as the default parameter in service constructors to maintain low friction while allowing test mocks.
2. **Context Propagation**: Implement `AsyncLocalStorage` (Node.js native) to store and propagate a context object containing `correlationId` and OpenTelemetry `spanContext`.
3. **Event Metadata**: Extend the `IEvent` interface to include a `metadata` object that carries `correlationId` and `traceId` across asynchronous event boundaries (e.g., in `InMemoryEventBus`).
4. **OpenTelemetry**: Integrate the OpenTelemetry SDK for standardized span creation and header propagation.
   - **Sampling Strategy**: Use probabilistic sampling (10%) for traces, but enforce 100% sampling for errors and exceptions.
5. **Correlation ID Convention**:
   - **HTTP Requests**: Extract or generate `req-{uuid}`.
   - **System Tasks (Cron/Startup)**: Explicitly generate domain-prefixed IDs (e.g., `cron-reconciliation-{uuid}`) before publishing events.

## Consequences
- **Positive**:
  - Full request-to-event-to-response traceability.
  - Consistent JSON-formatted logs for ingestion into external tools.
  - Debugging async flows becomes significantly easier.
- **Negative**:
  - Requires updating the `IEvent` contract and all event-publishing/subscribing code.
  - Slight overhead from context management in asynchronous tasks (expected to be negligible).
- **Neutral**:
  - Raw JSON logs streamed to stdout for external collector management.
  - Log level set to `info` in production.
