'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface CartItemDTO {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
  imageUrl?: string;
}

interface CartDTO {
  items: CartItemDTO[];
  totalQuantity: number;
  totalAmount: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resData = await apiFetch<any>('/cart', { cache: 'no-store' });
      
      // 確保抓到正確層級的 items 陣列或 cart 物件
      const cartObj = resData.cart || resData.data || resData;
      setCart(cartObj);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setError('無法載入購物車，請稍後再試。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();

    const handleCartUpdated = () => {
      loadCart();
    };

    window.addEventListener('cart-updated', handleCartUpdated);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated);
    };
  }, [loadCart]);

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    
    try {
      await apiFetch(`/cart/items/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQuantity }),
      });
      
      await loadCart();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (error: any) {
      console.error('Failed to update quantity:', error);
      alert(`更新失敗：${error.message || '請稍後再試'}`);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await apiFetch(`/cart/items/${productId}`, {
        method: 'DELETE',
      });
      await loadCart();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
      alert('刪除失敗，請稍後再試。');
    }
  };

  if (loading) return <div className="p-4">載入中...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">您的購物車</h1>
        <p className="mb-4">購物車目前是空的</p>
        <button className="bg-gray-500 text-white p-2 rounded" onClick={() => router.push('/products')}>前往選購</button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">您的購物車</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {cart.items.map((item) => {
            const isMaxStock = item.quantity >= item.stock;
            return (
              <div key={item.productId} className="flex border-b py-4 gap-4 items-center" data-testid="cart-item">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.title} className="w-20 h-20 object-cover" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-gray-600">${Number(item.price || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">庫存: {item.stock} 件</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="px-2 border rounded disabled:opacity-50" 
                    disabled={item.quantity <= 1}
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                  >-</button>
                  <span>{item.quantity}</span>
                  <button 
                    className="px-2 border rounded disabled:opacity-50" 
                    disabled={isMaxStock}
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                    data-testid="increase-qty-btn"
                  >+</button>
                </div>
                <p className="font-semibold">${Number(item.subtotal || 0).toFixed(2)}</p>
                <button className="text-red-500" onClick={() => handleRemoveItem(item.productId)} data-testid="remove-item-btn">刪除</button>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-100 p-6 rounded-lg h-fit">
          <h2 className="text-xl font-bold mb-4">訂單摘要</h2>
          <div className="flex justify-between mb-2">
            <span>總數量</span>
            <span>{cart.totalQuantity}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>總額</span>
            <span data-testid="cart-total-price">${Number(cart.totalAmount || 0).toFixed(2)}</span>
          </div>
          <button
            className="w-full bg-blue-600 text-white py-3 rounded font-bold"
            onClick={() => router.push('/checkout')}
          >
            前往結帳
          </button>
        </div>
      </div>
    </div>
  );
}
