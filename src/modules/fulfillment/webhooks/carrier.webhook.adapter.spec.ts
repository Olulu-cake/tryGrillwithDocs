
import { CarrierWebhookAdapter, ShipmentTrackingUpdatedEvent } from './carrier.webhook.adapter';
import { InMemoryEventBus } from '../../../shared/event-bus';

// A concrete implementation for testing
class TestCarrierWebhookAdapter extends CarrierWebhookAdapter {
  protected normalize(carrier: string, payload: any): ShipmentTrackingUpdatedEvent {
    return {
      type: 'ShipmentTrackingUpdatedEvent',
      data: {
        shipmentId: payload.id,
        trackingNumber: payload.tracking,
        status: payload.status,
        updatedAt: new Date(),
      },
    };
  }
}
// ... rest of the file ...

describe('CarrierWebhookAdapter', () => {
  it('should normalize webhook payload and publish to event bus', async () => {
    const mockEventBus = new InMemoryEventBus();
    const publishSpy = jest.spyOn(mockEventBus, 'publish');
    const adapter = new TestCarrierWebhookAdapter(mockEventBus);

    const payload = { id: 'ship_123', tracking: 'TRK999', status: 'in_transit' };
    await adapter.handle('TestCarrier', payload);

    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'ShipmentTrackingUpdatedEvent',
      data: expect.objectContaining({
        shipmentId: 'ship_123',
        status: 'in_transit'
      })
    }));
  });
});
