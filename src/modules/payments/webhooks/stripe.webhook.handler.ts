import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StripeWebhookHandler {
  async handle(eventId: string, eventType: string, payload: any) {
    await prisma.$transaction(async (tx) => {
      // 1. Idempotency Check
      const processed = await tx.processedWebhook.findUnique({
        where: { id: eventId },
      });

      if (processed) return; // Already processed

      // 2. Handle Event Type
      if (eventType === 'checkout.session.completed') {
        await this.processPaymentSuccess(tx, payload);
      }

      // 3. Mark as processed
      await tx.processedWebhook.create({
        data: {
          id: eventId,
          provider: 'STRIPE',
          eventType,
        },
      });
    });
  }

  private async processPaymentSuccess(tx: any, payload: any) {
    // Logic to update Order to PAID, deduct stock, etc.
  }
}
