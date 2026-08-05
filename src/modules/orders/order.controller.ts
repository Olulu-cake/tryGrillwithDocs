import { Request, Response } from 'express';
import { orderService } from './order.service';

export const createOrder = async (req: Request, res: Response) => {
  console.log('🔥🔥🔥 【已進入 createOrder 函式】收到 POST /api/orders 請求，Body 內容:', JSON.stringify(req.body));
  
  console.log('📌 步驟 1：準備解析 req.body');
  const { buyer, receiver, items, totalAmount } = req.body || {};
  
  // Security check: Force override buyer info for logged-in users
  const sessionUser = (req as any).session?.user;
  
  console.log('📌 步驟 2：準備呼叫 orderService.createOrder，資料為:', { 
    buyer: sessionUser ? { ...buyer, email: sessionUser.email } : buyer,
    receiver,
    userId: sessionUser?.id 
  });
  
  const orderData = {
    buyer: sessionUser ? {
      ...buyer,
      email: sessionUser.email,
    } : buyer,
    receiver,
    userId: sessionUser?.id,
  };
  
  try {
    const order = await orderService.createOrder(orderData, items, totalAmount);
    console.log('✅ 步驟 3：Prisma 建單成功，新訂單 ID:', order.id);
    return res.status(201).json({ success: true, order });
  } catch (error: any) {
    console.error('❌❌❌ 【Prisma 建單失敗原因】:', error.message);
    console.error('❌❌❌ 【完整錯誤堆疊】:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const order = await orderService.getOrderById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: '找不到該筆訂單' });
    }
    return res.status(200).json({ success: true, order });
  } catch (err: any) {
    console.error('[getOrderById Error]:', err);
    return res.status(500).json({ success: false, message: err.message || '查詢訂單失敗' });
  }
};

export const getOrdersByUser = async (req: Request, res: Response) => {
  const currentUser = (req as any).session?.user || (req as any).user || null;
  
  if (!currentUser) {
    return res.status(401).json({ success: false, message: '請先登入' });
  }

  const userId = currentUser.id;
  const email = currentUser.email;

  try {
    const orders = await orderService.getOrdersByUserId(userId, email);
    return res.status(200).json({ success: true, orders });
  } catch (err: any) {
    console.error('[getOrdersByUser Error]:', err);
    return res.status(500).json({ success: false, message: '查詢歷史訂單失敗' });
  }
};

export const trackOrder = async (req: Request, res: Response) => {
    try {
        const { id, orderId, email } = req.query;
        
        const identifier = (id || orderId) as string | undefined;
        
        if (!identifier || !email) {
            return res.status(400).json({ success: false, message: '請提供訂單 ID (id 或 orderId) 與 Email' });
        }
        
        const order = await orderService.getGuestOrder(identifier, email as string);
        if (!order) {
            return res.status(404).json({ success: false, message: '找不到該筆訂單或 Email 不符' });
        }
        
        const formattedOrder = {
          ...order,
          // 買家/收件人名稱相容
          buyerName: order.buyerName || '買家',
          receiverName: order.receiverName || '收件人',
          buyer: {
            name: order.buyerName,
            email: order.buyerEmail,
            phone: order.buyerPhone
          },
          receiver: {
            name: order.receiverName,
            phone: order.receiverPhone
          },
          // 金額相容
          totalAmount: Number(order.totalAmount || 0),
          total: Number(order.totalAmount || 0),
          amount: Number(order.totalAmount || 0),
          shippingAmount: Number(order.shippingAmount || 0),
          // 地址相容
          shippingAddress: order.shippingAddress || '',
          address: order.shippingAddress || '',
          items: (order.items || []).map((item: any) => ({
            ...item,
            priceAtPurchase: Number(item.priceAtPurchase),
            price: Number(item.price || item.priceAtPurchase || 0),
            title: item.title || item.productTitle || item.name || '商品',
            product: item.product || {
              id: item.productId,
              title: item.title || item.productTitle || item.name || '商品',
              price: Number(item.price || item.priceAtPurchase || 0)
            }
          }))
        };

        return res.status(200).json({ success: true, order: formattedOrder });
    } catch (err: any) {
        console.error('[trackOrder Error]:', err);
        return res.status(500).json({ success: false, message: '查詢訂單失敗' });
    }
}
