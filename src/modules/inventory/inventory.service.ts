import { prisma } from '../../shared/database';

export class InventoryService {
  /**
   * 1. 🛡️ 原子化預留庫存 - 採用條件更新樂觀鎖防超賣 (最強並發防禦)
   */
  async reserveStock(productId: string, cartId: string, quantity: number) {
    const result = await prisma.$transaction(async (tx) => {
      const affectedRows = await tx.inventoryItem.updateMany({
        where: {
          productId,
          availableStock: { gte: quantity }, // 樂觀鎖防禦條件：WHERE available_stock >= quantity
        },
        data: {
          availableStock: { decrement: quantity },
          reservedStock: { increment: quantity },
        },
      });

      if (affectedRows.count === 0) {
        throw new Error('Insufficient stock');
      }

      const expirationTime = new Date(Date.now() + 15 * 60 * 1000);
      return await tx.stockReservation.create({
        data: {
          productId,
          cartId,
          quantity,
          expirationTime,
        },
      });
    });

    return result;
  }

  /**
   * 2. 精準釋放預留庫存
   */
  async releaseStock(productId: string, cartId: string) {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findFirst({
        where: { productId, cartId },
      });

      if (!reservation) return null;

      await tx.inventoryItem.update({
        where: { productId },
        data: {
          availableStock: { increment: reservation.quantity },
          reservedStock: { decrement: reservation.quantity },
        },
      });

      return await tx.stockReservation.delete({
        where: { id: reservation.id },
      });
    });
  }

  /**
   * 4. 延長預留期限
   */
  async extendReservation(productId: string, cartId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findFirst({
        where: { productId, cartId },
      });

      if (!reservation) return;

      // 1. Re-verify: Check if the product is still in inventory
      const inventory = await tx.inventoryItem.findUnique({
        where: { productId },
      });
      if (!inventory) throw new Error('Product no longer exists');

      // 2. Idempotency: Check if already extended
      // Initial expiration is createdAt + 15 mins.
      // If it's already > createdAt + 16 mins, it's already extended.
      if (reservation.expirationTime.getTime() > reservation.createdAt.getTime() + 16 * 60 * 1000) {
        return;
      }

      // 3. Extend to 30 minutes from createdAt
      await tx.stockReservation.update({
        where: { id: reservation.id },
        data: {
          expirationTime: new Date(reservation.createdAt.getTime() + 30 * 60 * 1000),
        },
      });
    });
  }

  /**
   * 3. 批次清理維護任務
   */
  async expireReservations() {
    await prisma.$transaction(async (tx) => {
      const expiredReservations = await tx.stockReservation.findMany({
        where: {
          expirationTime: { lt: new Date() },
        },
      });

      if (expiredReservations.length === 0) return;

      for (const reservation of expiredReservations) {
        await tx.inventoryItem.update({
          where: { productId: reservation.productId },
          data: {
            availableStock: { increment: reservation.quantity },
            reservedStock: { decrement: reservation.quantity },
          },
        });
      }

      await tx.stockReservation.deleteMany({
        where: {
          id: { in: expiredReservations.map((r) => r.id) },
        },
      });
    });
  }
}