# Production Deployment Guide

This document outlines the strategies for deploying this modular monolith application to production.

## Environment Configuration

Use the `.env.production.example` file as a template for your production configuration. Ensure all sensitive values are injected via your platform's secret management system (e.g., AWS Secrets Manager, GCP Secret Manager).

## Database Migrations

Database migrations must be executed **before** the new application version is deployed to ensure schema compatibility.

1.  **Pipeline Step:** In your CI/CD pipeline, add a step to run migrations.
2.  **Command:** `npm run db:migrate` (or the equivalent Prisma command configured in your `package.json`).
3.  **Safety:** Migrations should be idempotent. Ensure you have automated database backups before running migrations in production.

## Healthcheck & Zero-Downtime Strategy

The application provides a healthcheck endpoint (e.g., `/health`).
- **Load Balancer:** Configure your ALB/Ingress to perform health checks against this endpoint.
- **Strategy:** Use **Rolling Updates**. The load balancer will wait for the new containers to pass health checks before routing traffic away from the old containers and terminating them.

---

## Option A: GCP Setup (Cloud Run)

1.  **Containerize:** Build and push the image to Google Container Registry (GCR) or Artifact Registry.
2.  **Cloud SQL:** Provision a PostgreSQL instance. Use the [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy) or a VPC connector for secure connection.
3.  **Memorystore:** Provision a Redis instance in the same VPC.
4.  **Deployment:** Deploy to **Cloud Run**, referencing the container image.
5.  **Secrets:** Use **GCP Secret Manager** to inject environment variables into the Cloud Run service.

## Option B: AWS Setup (ECS Fargate)

1.  **Infrastructure:**
    *   **VPC:** Multi-AZ deployment.
    *   **RDS:** PostgreSQL instance in private subnets.
    *   **ElastiCache:** Redis cluster in private subnets.
2.  **ECS Fargate:**
    *   Define a Task Definition referencing your image from ECR.
    *   Use **AWS Secrets Manager** to map secrets directly into the task environment variables.
3.  **Networking:**
    *   **ALB:** Application Load Balancer to route traffic to the Fargate service.
    *   **SSL:** Use ACM to manage certificates and bind them to the ALB Listener.
4.  **Deployment:** Utilize CodePipeline/CodeDeploy to perform rolling updates.
