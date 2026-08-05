
import { InventoryService } from './inventory.service';
import { prisma } from '../../shared/database';

describe('InventoryService Unit Test', () => {
  let inventoryService: InventoryService;

  beforeEach(async () => {
    inventoryService = new InventoryService();
    // 為了安全，確保本地 SQLite 驅動先通電
    try {
      await prisma.stockReservation.deleteMany();
    } catch (e) {}
  });

  it('should be operational', () => {
    expect(inventoryService).toBeDefined();
  });
});