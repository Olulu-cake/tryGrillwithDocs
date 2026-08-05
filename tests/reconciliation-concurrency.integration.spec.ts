
import { ReconciliationService } from '../src/modules/fulfillment/services/reconciliation.service';
import { OrderStateService } from '../src/modules/orders/order.state.service';

describe('ReconciliationService Concurrency (ADR-0016)', () => {
  let reconciliationService: ReconciliationService;
  let orderStateService: OrderStateService;

  beforeEach(() => {
    // Mock dependencies
    const mockShippingProvider = {
        getTrackingInfo: jest.fn(),
    } as any;

    const mockOrderStateService = {
        transition: jest.fn(),
    } as any;
    
    reconciliationService = new ReconciliationService(mockShippingProvider, mockOrderStateService);
  });

  it('should retry transaction and NOOP when state is already updated (Optimistic Lock Contention)', async () => {
    // 1. Setup Order in SHIPPED state (Use a mock store instead of DB)
    const orderId = 'order-123';
    const store = { [orderId]: { id: orderId, state: 'SHIPPED', version: 1 } };

    // 2. Mock shipping provider returning DELIVERED
    const trackingInfo = { status: 'delivered' };
    jest.spyOn(reconciliationService['shippingProvider'], 'getTrackingInfo').mockResolvedValue(trackingInfo as any);

    // 3. Simulate contention
    let attempt = 0;
    jest.spyOn(reconciliationService['orderStateService'], 'transition').mockImplementation(async () => {
      attempt++;
      if (attempt === 1) {
        // Simulate concurrent update
        store[orderId].state = 'DELIVERED';
        throw new Error('OptimisticLockException'); 
      }
      return Promise.resolve();
    });

    // 4. Act
    await reconciliationService.reconcile( { orderId, trackingNumber: 'track-123', currentStatus: 'SHIPPED' });

    // 5. Assert
    expect(store[orderId].state).toBe('DELIVERED');
    expect(attempt).toBe(2); 
  });
});
