
import { eventBus } from './event-bus';
import { contextStorage } from './context';
import { IEvent } from './event-bus';

describe('EventBus Context Propagation', () => {
  it('should propagate correlation ID across async boundary', async () => {
    const correlationId = 'test-correlation-id';
    let capturedCorrelationId: string | undefined;

    // Set context
    await contextStorage.run({ correlationId }, async () => {
      // Subscribe to event
      await eventBus.subscribe('test.event', (event) => {
        capturedCorrelationId = contextStorage.getStore()?.correlationId;
      });

      // Publish event
      const event: IEvent = { type: 'test.event', timestamp: new Date(), payload: {} };
      await eventBus.publish(event);
    });

    // Wait a bit for the async event to be processed
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(capturedCorrelationId).toBe(correlationId);
  });
});
