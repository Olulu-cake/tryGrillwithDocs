import { PaymentGateway } from './payment-gateway.interface';
// import stripe from 'stripe'; // Assuming stripe SDK is installed

export class StripeAdapter implements PaymentGateway {
  // private stripeClient: stripe;

  constructor() {
    // this.stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async createIntent(amount: number, orderId: string, currency: string) {
    // Implementation for Stripe Checkout Session creation
    // return { providerId: '...', clientSecret: '...' };
    return { providerId: 'pi_mock_123', clientSecret: 'secret_abc' };
  }

  async refund(providerId: string, amount: number) {
    // Implementation for Stripe Refund
  }
}
