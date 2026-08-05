
import { ReconciliationService } from '../modules/fulfillment/services/reconciliation.service';
import { ShippingProvider, TrackingStatus } from '../modules/fulfillment/providers/shipping-provider.interface';
import { OrderStateService } from '../modules/orders/order.state.service';

describe('Shipment Reconciliation Integration', () => {
  it('should identify a stale shipment and transition order status to DELIVERED', async () => {
    // 1. Setup Mocks
    const mockShippingProvider: ShippingProvider = {
      createLabel: jest.fn(),
      getTrackingStatus: jest.fn(),
      getTrackingInfo: jest.fn().mockResolvedValue({
        trackingNumber: 'TRK123',
        status: 'delivered',
        lastUpdated: new Date(),
      } as TrackingStatus),
    };

    const mockOrderStateService = {
      transition: jest.fn().mockResolvedValue(undefined),
    } as unknown as OrderStateService;

    const reconciliationService = new ReconciliationService(mockShippingProvider, mockOrderStateService);

    // 2. Data: Stale shipment (in system: 'SHIPPED', but actual status: 'delivered')
    const staleShipment = {
      orderId: 'ORDER123',
      trackingNumber: 'TRK123',
      currentStatus: 'SHIPPED',
    };

    // 3. Act: Trigger reconciliation
    await reconciliationService.reconcile(staleShipment);

    // 4. Assert: Shipping provider was queried, and OrderStateService transitioned the order
    expect(mockShippingProvider.getTrackingInfo).toHaveBeenCalledWith('TRK123');
    expect(mockOrderStateService.transition).toHaveBeenCalledWith('ORDER123', 'COMPLETED'); // Assuming 'COMPLETED' is mapped from 'delivered'
  });
});
