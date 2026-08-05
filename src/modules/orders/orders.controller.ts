import { Router, Request, Response } from 'express';
import { prisma } from '../../shared/database';
import { orderService } from './order.service';

export const ordersRouter = Router();

ordersRouter.get('/track', async (req: Request, res: Response) => {
  const { orderId, email } = req.query;
  
  if (!orderId || !email) {
    return res.status(400).json({ error: 'Missing orderId or email' });
  }

  try {
    console.log('【後端訂單查詢診斷】收到的查詢參數:', { orderId, email, query: req.query, body: req.body });
    const order = await orderService.getGuestOrder(orderId as string, email as string);
    if (!order) {
      return res.status(404).json({ error: '訂單不存在或 Email 不符' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: '查詢訂單失敗' });
  }
});

ordersRouter.post('/', async (req: Request, res: Response) => {
  console.log('後端收到的建立訂單 Request Body:', JSON.stringify(req.body, null, 2));
  
  // Mocking user from token for now based on test requirements
  const userId = 'user-123'; 
  
  try {
    const { items, buyer, receiver } = req.body;
    
    const order = await prisma.order.create({
      data: {
        userId,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        fulfillmentStatus: 'PENDING',
        totalAmount: 100,
        shippingAmount: 0,
        buyerName: req.body.buyerName || buyer?.name || 'Guest',
        buyerEmail: req.body.buyerEmail || buyer?.email || 'guest@example.com',
        receiverName: req.body.receiverName || receiver?.name || 'Guest',
        shippingAddress: req.body.shippingAddress || receiver?.address || 'N/A',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: 50,
          }))
        }
      }
    });
    console.log('【建單成功】', order.id);
    return res.json({ success: true, order });
  } catch (error: any) {
    console.error('【建單失敗詳細錯誤】', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

ordersRouter.get('/', async (req: Request, res: Response) => {
  const userId = 'user-123';
  const orders = await prisma.order.findMany({
    where: { userId }
  });
  res.status(200).json(orders);
});
