import pino from 'pino';

// Try using a direct string for timestamp to bypass the function call if needed
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  // Use a simple time function to debug the issue
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  redact: ['email', 'phone', 'recipientAddress', 'paymentDetails'],
});
