'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStatusLabel } from '@/lib/utils';
import { Order } from '@/types/order';
import { apiFetchRaw } from '@/lib/api';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      setIsLoggedIn(false);
      setLoading(false);
      router.push('/login');
      return;
    }
    
    setIsLoggedIn(true);

    apiFetchRaw('/orders/user')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch orders');
        }
        const responseData = await res.json();
        // 根據後端 controller，回傳結構為 { success: true, orders: [...] }
        const ordersData = responseData.success ? responseData.orders : [];
        setOrders(ordersData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoggedIn(false);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>載入中...</div>;

  if (!isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <p className="mb-4">請先登入以查看歷史訂單</p>
        <button onClick={() => router.push('/login')} className="px-4 py-2 bg-blue-500 text-white rounded">登入</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">歷史訂單</h1>
      {orders.length === 0 ? <p>沒有訂單紀錄</p> : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="border p-4 rounded shadow-sm">
              <div className="flex justify-between">
                <p className="font-semibold">訂單編號: {order.id}</p>
                <p>{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <p>狀態: {getStatusLabel(order.status)}</p>
              <p>總金額: ${order.totalAmount}</p>
              
              <div className="mt-2">
                <p className="font-semibold">訂單商品:</p>
                <ul className="list-disc pl-5">
                  {order.items?.map((item: any, index: number) => (
                    <li key={index}>
                      {item.productName} - {item.quantity} x ${item.price}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
