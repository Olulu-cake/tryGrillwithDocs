export interface PaymentGateway {
  createIntent(amount: number, orderId: string, currency: string): Promise<{ providerId: string; clientSecret?: string }>;
  refund(providerId: string, amount: number): Promise<void>;
}
