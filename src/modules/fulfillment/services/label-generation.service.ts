import { ShippingProvider, CreateLabelInput, LabelGenerationResult } from '../providers/shipping-provider.interface';

export interface LabelGenerationFailedEvent {
  type: 'LabelGenerationFailedEvent';
  data: {
    orderId: string;
  };
}

export interface EventBus {
  publish(event: any): Promise<void>;
}

export class LabelGenerationService {
  private jobStatuses: Map<string, string> = new Map();

  constructor(
    private shippingProvider: ShippingProvider,
    private eventBus: EventBus
  ) {}

  async processLabelGeneration(input: CreateLabelInput): Promise<LabelGenerationResult> {
    const maxAttempts = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.shippingProvider.createLabel(input);
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt} failed for order ${input.orderId}: ${lastError.message}`);
        
        if (attempt < maxAttempts) {
          // Exponential backoff: 100ms, 200ms
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 100));
        }
      }
    }

    // Terminal failure
    this.jobStatuses.set(input.orderId, 'PENDING_MANUAL_INTERVENTION');
    
    await this.eventBus.publish({
      type: 'LabelGenerationFailedEvent',
      data: { orderId: input.orderId }
    });

    throw lastError;
  }

  async getJobStatus(orderId: string): Promise<string> {
    return this.jobStatuses.get(orderId) || 'UNKNOWN';
  }
}
