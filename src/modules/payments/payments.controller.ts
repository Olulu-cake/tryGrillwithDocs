import { Router } from 'express';
import { PaymentsService } from './payments.service';

export const paymentsRouter = Router();
const paymentsService = new PaymentsService();

paymentsRouter.post('/checkout', async (req, res) => {
  try {
    const { orderId } = req.body;
    const result = await paymentsService.initiateCheckout(orderId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

paymentsRouter.post('/webhook', async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const result = await paymentsService.handleWebhook(orderId, status);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
