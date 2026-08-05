

describe('Logger PII Masking', () => {
  it('should redact sensitive fields', async () => {
    // Spy on process.stdout
    const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    // Dynamic import to ensure logger is initialized *after* we set up the spy
    const { logger } = await import('./logger');

    const sensitiveData = {
      email: 'user@example.com',
      phone: '123-456-7890',
      recipientAddress: '123 Main St',
      paymentDetails: 'visa-4242',
      other: 'safe',
    };

    logger.info(sensitiveData);

    const output = writeSpy.mock.calls[0][0];
    const logEntry = JSON.parse(output.toString());

    expect(logEntry.email).toBe('[Redacted]');
    expect(logEntry.phone).toBe('[Redacted]');
    expect(logEntry.recipientAddress).toBe('[Redacted]');
    expect(logEntry.paymentDetails).toBe('[Redacted]');
    expect(logEntry.other).toBe('safe');
    
    writeSpy.mockRestore();
  });
});
