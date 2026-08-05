// Contract definition for normalized shipment tracking event
export interface ShipmentTrackingUpdatedEvent {
  type: 'ShipmentTrackingUpdatedEvent';
  data: {
    shipmentId: string;
    trackingNumber: string;
    status: 'pending' | 'in_transit' | 'delivered' | 'failed';
    updatedAt: Date;
  };
}

// Contract for the internal event bus
export interface EventBus {
  publish(event: ShipmentTrackingUpdatedEvent): Promise<void>;
}

export abstract class CarrierWebhookAdapter {
  constructor(protected eventBus: EventBus) {}

  /**
   * Processes vendor-specific webhooks and broadcasts normalized events.
   */
  async handle(carrier: string, payload: any): Promise<void> {
    const normalizedEvent = this.normalize(carrier, payload);
    await this.eventBus.publish(normalizedEvent);
  }

  /**
   * Must be implemented by concrete adapters (e.g., FedExWebhookAdapter)
   * to handle vendor-specific payload structures.
   */
  protected abstract normalize(carrier: string, payload: any): ShipmentTrackingUpdatedEvent;
}
