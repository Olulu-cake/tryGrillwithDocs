
import pino from 'pino';
import { logger } from './logger';

// Mock pino to verify calls
jest.mock('pino', () => ({
  default: jest.fn(() => ({
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('Logger Utility', () => {
  it('should be a valid pino instance', () => {
    expect(logger).toBeDefined();
    expect(logger.child).toBeDefined();
  });

  it('should support child loggers with context', () => {
    const childLogger = logger.child({ module: 'TestModule' });
    expect(logger.child).toHaveBeenCalledWith({ module: 'TestModule' });
  });
});
