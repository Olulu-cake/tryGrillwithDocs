
import { contextStorage, getCorrelationId } from './context';

describe('Context Storage', () => {
  it('should store and retrieve context', async () => {
    const context = { correlationId: 'test-id' };
    await contextStorage.run(context, () => {
      expect(getCorrelationId()).toBe('test-id');
    });
  });

  it('should return undefined when no context is set', () => {
    expect(getCorrelationId()).toBeUndefined();
  });
});
