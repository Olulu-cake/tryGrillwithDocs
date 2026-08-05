import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PromotionService {
  async validateCoupon(code: string, orderAmount: number): Promise<boolean> {
    const coupon = await (prisma as any).coupon.findUnique({ where: { code } });
    if (!coupon) return false;
    if (coupon.expiryDate && coupon.expiryDate < new Date()) return false;
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return false;
    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) return false;
    return true;
  }

  async applyCoupon(code: string): Promise<void> {
    await (prisma as any).coupon.update({
      where: { code },
      data: { usedCount: { increment: 1 } },
    });
  }
}
