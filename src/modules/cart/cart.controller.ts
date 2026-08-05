import { Router, Request, Response } from 'express';
import { cartService } from './cart.service';

export const cartController = Router();

// Mock cart ID
const getCartId = () => 'cart-123';

cartController.get('/', async (req: Request, res: Response) => {
  try {
    const cart = await cartService.getCart(getCartId());
    res.json({ cart });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

cartController.post('/items', async (req: Request, res: Response) => {
  const { productId, id, quantity } = req.body || {};
  const finalProductId = productId || id;
  
  if (!finalProductId) {
    return res.status(400).json({ success: false, message: '缺少有效的商品 ID (productId)' });
  }

  try {
    await cartService.addItem(getCartId(), finalProductId, quantity || 1);
    const cart = await cartService.getCart(getCartId());
    res.status(201).json({ cart });
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message });
  }
});

cartController.patch('/items/:productId', async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const { quantity } = req.body;
    await cartService.updateQuantity(getCartId(), productId, quantity);
    const cart = await cartService.getCart(getCartId());
    res.json({ cart });
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message });
  }
});

cartController.delete('/items/:productId', async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    await cartService.removeItem(getCartId(), productId);
    const cart = await cartService.getCart(getCartId());
    res.json({ cart });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

cartController.delete('/', async (req: Request, res: Response) => {
  try {
    await cartService.clearCart(getCartId());
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
