'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/src/utils/trpc';
import { apiFetch } from '@/lib/api';
import { useCart } from '@/app/context/CartContext';

export default function CheckoutPage() {
  const { clearCart } = useCart();
  const [cart, setCart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [syncBuyerReceiver, setSyncBuyerReceiver] = useState(false);
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    receiverName: '',
    receiverPhone: '',
    shippingAddress: '',
    paymentMethod: 'CREDIT_CARD',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const [cartData, userData] = await Promise.all([
          apiFetch<any>('/api/cart', { cache: 'no-store' }),
          apiFetch<any>('/api/auth/me').catch(() => null)
        ]);

        setCart(cartData.cart || cartData.data || cartData);

        if (userData && userData.user) {
          setIsLoggedIn(true);
          setFormData(prev => ({
            ...prev,
            buyerName: userData.user.name || prev.buyerName,
            buyerEmail: userData.user.email || prev.buyerEmail,
          }));
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error('Checkout init error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (syncBuyerReceiver) {
      setFormData(prev => ({
        ...prev,
        receiverName: prev.buyerName,
        receiverPhone: prev.buyerPhone,
      }));
    }
  }, [syncBuyerReceiver, formData.buyerName, formData.buyerPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const resData = await apiFetch<any>('/api/orders', {
            method: 'POST',
            body: JSON.stringify({
                buyer: {
                    name: formData.buyerName,
                    email: formData.buyerEmail,
                    phone: formData.buyerPhone,
                },
                receiver: {
                    name: formData.receiverName,
                    phone: formData.receiverPhone,
                    shippingAddress: formData.shippingAddress,
                },
                fallbackItems: cart?.items || [],
                fallbackTotal: cart?.totalAmount || 0
            })
        });
        
        const orderId = resData.id || resData.orderId || 'ORD-TEST';
        
        // 清空伺服器端與本地端的購物車
        await apiFetch('/api/cart', { method: 'DELETE' });
        
        // 使用上下文的清空函數並加上雙重保險
        clearCart();
        // 如果 CartContext 有提供 setCartItems，強制同步設定為空
        // 由於我們在 page 內無法直接存取 Provider 的 setter，需要調整 CartContext 暴露 setter 或直接操作
        // 基於現有 CartContext 結構，修改為：
        if (typeof window !== 'undefined') {
            localStorage.setItem('cartItems', '[]');
            window.dispatchEvent(new Event('cart-updated'));
        }
        
        // 強制重新整理頁面以更新 Navbar
        router.refresh();
        
        router.push(`/checkout/success?orderId=${orderId}`);
    } catch (err: any) {
        console.error('Checkout error:', err);
        alert(`訂單建立失敗: ${err.message || '請稍後再試'}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">結帳</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-bold">訂購人資訊</h2>
            <input type="text" placeholder="姓名" required value={formData.buyerName} className="w-full p-2 border rounded" onChange={e => setFormData({...formData, buyerName: e.target.value})} data-testid="checkout-buyer-name" />
            <input type="email" placeholder="Email" required value={formData.buyerEmail} readOnly={isLoggedIn} className="w-full p-2 border rounded read-only:bg-gray-200" onChange={e => setFormData({...formData, buyerEmail: e.target.value})} data-testid="checkout-buyer-email" />
            <input type="tel" placeholder="電話" required value={formData.buyerPhone} className="w-full p-2 border rounded" onChange={e => setFormData({...formData, buyerPhone: e.target.value})} data-testid="checkout-buyer-phone" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">收件人資訊</h2>
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={syncBuyerReceiver} onChange={e => setSyncBuyerReceiver(e.target.checked)} />
                同訂購人
              </label>
            </div>
            <input type="text" placeholder="姓名" required value={formData.receiverName} className="w-full p-2 border rounded" onChange={e => setFormData({...formData, receiverName: e.target.value})} data-testid="checkout-shipping-name" />
            <input type="tel" placeholder="電話" required value={formData.receiverPhone} className="w-full p-2 border rounded" onChange={e => setFormData({...formData, receiverPhone: e.target.value})} data-testid="checkout-shipping-phone" />
            <input type="text" placeholder="配送地址" required value={formData.shippingAddress} className="w-full p-2 border rounded" onChange={e => setFormData({...formData, shippingAddress: e.target.value})} data-testid="checkout-shipping-address" />
          </div>

          <select className="w-full p-2 border rounded" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
            <option value="CREDIT_CARD">信用卡</option>
            <option value="COD">貨到付款</option>
            <option value="LINE_PAY">LINE Pay</option>
          </select>
          <button type="submit" className="w-full bg-green-500 text-white py-2 rounded font-bold" disabled={isSubmitting} data-testid="submit-order-btn">
            {isSubmitting ? '建立訂單中...' : '送出訂單'}
          </button>
        </form>


        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold mb-4">訂單摘要</h2>
          {cart?.items?.map((item: any) => (
            <div key={item.productId} className="flex justify-between mb-2">
              <span>{item.title} x {item.quantity}</span>
              <span>${Number(item.subtotal || 0).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t mt-4 pt-4 font-bold text-lg flex justify-between">
            <span>總計</span>
            <span>${Number(cart?.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
