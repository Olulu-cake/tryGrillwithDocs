'use client';

export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { getStatusLabel } from '@/lib/utils';
import { trpc } from '@/src/utils/trpc';

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setOrder(null);
    try {
      const data = await trpc.order.trackOrder.query({ orderId, email });
      setOrder(data);
    } catch (err: any) {
      setError(err.message || '查詢失敗');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">訂單追蹤</h1>
      <form onSubmit={handleTrack} className="space-y-4">
        <div>
          <label className="block">訂單編號</label>
          <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="border p-2 w-full" required />
        </div>
        <div>
          <label className="block">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 w-full" required />
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded" disabled={isLoading}>
          {isLoading ? '查詢中...' : '查詢'}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}
      {order && (
        <div className="mt-4 p-4 border rounded">
          <h2 className="font-bold">訂單狀態: {getStatusLabel(order.status)}</h2>
          <p>訂購人: {order.buyerName || '買家'}</p>
          <p>收件人: {order.receiverName || '收件人'}</p>
          <p>配送地址: {order.shippingAddress || '無地址資訊'}</p>
          <p>總金額: ${Number(order.totalAmount ?? 0).toFixed(2)}</p>
          <h3 className="font-bold mt-2">商品明細:</h3>
          <ul>
            {order.items.map((item: any, index: number) => (
              <li key={index}>
                商品 ID: {item.productId} x {item.quantity} - ${Number(item.priceAtPurchase ?? 0).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
