# ADR-0015: Security Hardening

Date: 2026-07-25
Status: Implemented

## Context
As the e-commerce system matures, we must implement robust security measures to protect against unauthorized access, verify webhook integrity, and ensure data privacy in our observability logs.

## Decision
We have implemented the following security enhancements:

### 1. Webhook HMAC Verification
To ensure the integrity and authenticity of incoming webhooks from payment gateways and shipping carriers, we will enforce strict HMAC signature verification. 
- All webhook handlers must implement a middleware/adapter layer to validate the signature using the shared secret.
- Requests without a valid signature will be rejected with a 401 Unauthorized status.

### 2. Authentication & RBAC
We will implement JWT-based authentication for administrative endpoints.
- **Authentication:** Use an AuthGuard to validate JWT tokens in the request header.
- **RBAC:** Implement Role-Based Access Control to restrict access to sensitive operations (e.g., manual DLQ retries, configuration changes) to authorized roles.

### 3. PII Masking
To comply with data privacy standards, we will automatically mask PII in our logs.
- We have integrated Pino's native redaction capability to identify and redact sensitive fields (e.g., `email`, `phone`, `recipientAddress`, `paymentDetails`) before they are written to standard output.

## Consequences
- **Positive:** Improved system integrity, enhanced security for administrative actions, and adherence to data privacy regulations.
- **Negative:** Increased complexity in webhook adapter implementation and logging infrastructure. Slight performance overhead due to signature validation and log redaction.
