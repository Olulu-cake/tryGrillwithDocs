import { ShippingProvider } from '../providers/shipping-provider.interface';
import { OrderStateService } from '../../orders/order.state.service';
import * as opentelemetry from '@opentelemetry/api';

export interface StaleShipment {
  orderId: string;
  trackingNumber: string;
  currentStatus: string;
}

export class ReconciliationService {
  constructor(
    private shippingProvider: ShippingProvider,
    private orderStateService: OrderStateService
  ) {}

  async getUnresolvedMismatches() {
    // In a real app, this would query the DB
    return [
      { orderId: 'ord1', trackingNumber: 'track1', currentStatus: 'SHIPPED' },
      { orderId: 'ord2', trackingNumber: 'track2', currentStatus: 'SHIPPED' },
    ];
  }

  async reconcile(shipment: StaleShipment): Promise<void> {
    const tracer = opentelemetry.trace.getTracer('reconciliation-service');
    
    // In a real scenario, we'd extract parentContext from shipment.metadata if passed
    // For this implementation, we assume we have access to it or mock it.
    await tracer.startActiveSpan('reconcile-order', {
      links: [] // OTel Span Linking logic goes here
    }, async (span) => {
      try {
        await this.performReconciliation(shipment);
      } finally {
        span.end();
      }
    });
  }

  private async performReconciliation(shipment: StaleShipment, isRetry = false): Promise<void> {
    const trackingInfo = await this.shippingProvider.getTrackingInfo(shipment.trackingNumber);

    if (trackingInfo.status === 'delivered') {
      try {
        await this.orderStateService.transition(shipment.orderId, 'COMPLETED');
      } catch (error: any) {
        if (error.message === 'OptimisticLockException' && !isRetry) {
          // Re-verify state and retry once
          const currentOrder = await this.getCurrentOrderState(shipment.orderId);
          if (currentOrder.status !== 'COMPLETED') {
            await this.performReconciliation(shipment, true);
          }
        } else {
          throw error;
        }
      }
    }
  }

  private async getCurrentOrderState(orderId: string): Promise<{ status: string }> {
    // Mocked for now - would be a DB call
    return { status: 'SHIPPED' };
  }
}

export const reconciliationService = new ReconciliationService({} as any, {} as any);
