'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetchRaw } from '@/lib/api';

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  buyer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  receiver?: {
    name?: string;
    phone?: string;
    shippingAddress?: string;
  };
  name?: string;
  phone?: string;
  address?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;
      try {
        const response = await apiFetchRaw(`/orders/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('找不到該筆訂單資料');
          }
          throw new Error('無法取得訂單資料');
        }
        const data = await response.json();
        // 後端回傳格式為 { success: true, order: { ... } }
        const actualOrder = data.order || data;
        setOrder(actualOrder);
      } catch (err: any) {
        console.error('讀取訂單失敗:', err);
        setError(err.message || '讀取訂單失敗');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id]);

  // 動態解析買家、電話、地址資料 (優先讀取 buyer / receiver 物件)
  const buyerName = order?.buyer?.name || order?.name || '無資料';
  const phone = order?.buyer?.phone || order?.receiver?.phone || order?.phone || '無資料';
  const address = order?.receiver?.shippingAddress || order?.address || '無資料';

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6">
      <h1 className="text-2xl font-bold mb-4">訂單明細</h1>

      {loading && (
        <div className="p-6 text-center text-gray-600" aria-label="loading-container">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-2"></div>
          <p>載入訂單中...</p>
        </div>
      )}

      {/* API 失敗時顯示真實錯誤，不印出任何假個人資料 */}
      {!loading && (error || !order) && (
        <div className="p-6 border rounded-lg shadow-sm bg-white text-center" aria-label="error-container">
          <div className="mb-2">
            <span className="text-xs text-gray-500 block">查詢單號</span>
            <span className="font-mono font-bold text-gray-800" data-testid="order-id">{id}</span>
          </div>
          <p className="text-red-600 font-semibold">{error || '找不到訂單資料'}</p>
        </div>
      )}

      {/* 成功獲取訂單時，渲染真實的 API 資料 */}
      {!loading && order && (
        <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4 border-b pb-4">
            <div>
              <span className="text-xs text-gray-500 block">訂單編號</span>
              <span className="font-mono font-bold text-gray-800" data-testid="order-id">{order.id || id}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">訂購人</span>
              <span className="text-gray-800" data-testid="order-name">{buyerName}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">聯絡電話</span>
              <span className="text-gray-800" data-testid="order-phone">{phone}</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-gray-500 block">配送地址</span>
              <span className="text-gray-800" data-testid="order-address">{address}</span>
            </div>
          </div>

          {/* 明細品項 */}
          <div className="space-y-2">
            <span className="text-xs text-gray-500 block">購買商品</span>
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.title} <span className="text-gray-400">x{item.quantity}</span>
                </span>
                <span className="font-medium">NT$ {item.subtotal || item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {/* 總金額 */}
          <div className="border-t pt-3 flex justify-between items-center text-sm">
            <span className="font-bold text-gray-800">訂單總金額</span>
            <span className="text-lg font-bold text-blue-600">NT$ {order.totalAmount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
