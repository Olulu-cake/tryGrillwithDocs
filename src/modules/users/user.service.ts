import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserService {
  /**
   * Finds or creates a guest shadow user account.
   */
  async getOrCreateGuestUser(email: string) {
    // 1. Try to find existing user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      return user;
    }

    // 2. Create shadow user if not exists
    return await prisma.user.create({
      data: {
        email,
        role: 'customer',
        isRegistered: false, // Indicates shadow account
      },
    });
  }

  /**
   * Transitions a shadow account to a registered account.
   */
  async registerUser(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        isRegistered: true,
      },
    });
  }

  /**
   * Background task: Prune uncompleted/abandoned guest shadow accounts after 24 hours.
   */
  async pruneAbandonedGuests() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Using transaction to ensure atomic deletion of dependent data if any
    await prisma.$transaction(async (tx) => {
      // Find guest users older than 24h that are not registered
      const abandonedGuests = await tx.user.findMany({
        where: {
          isRegistered: false,
          createdAt: { lt: twentyFourHoursAgo },
        },
        select: { id: true },
      });

      if (abandonedGuests.length === 0) return;

      const guestIds = abandonedGuests.map(g => g.id);

      // Delete addresses associated with these guests
      await tx.address.deleteMany({
        where: { userId: { in: guestIds } },
      });

      // Delete the guest users themselves
      await tx.user.deleteMany({
        where: { id: { in: guestIds } },
      });
    });
  }
}
