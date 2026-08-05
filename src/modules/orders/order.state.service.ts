import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderStateService {
  async transition(orderId: string, nextStatus: 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'): Promise<void> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    // Simple state transition validation
    if (order.status === 'CANCELLED') throw new Error('Cannot transition from CANCELLED');
    
    await prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });

    if (nextStatus === 'CANCELLED') {
        // Trigger inventory release logic
    }
  }
}
