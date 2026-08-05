'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, KeyboardEvent, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();

  const fetchCartCount = useCallback(async () => {
    try {
      const response = await apiFetch('/api/cart', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setCartCount(data.cart?.totalQuantity || 0);
      } else {
        setCartCount(0);
      }
    } catch (e) {
      console.error('Failed to fetch cart count', e);
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    setHasMounted(true);

    const updateUser = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    updateUser();
    fetchCartCount();
    
    // Listen for storage changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'user') updateUser();
    });
    
    // Custom event for login/logout actions
    window.addEventListener('user-login', updateUser);
    window.addEventListener('cart-updated', fetchCartCount);
    
    return () => {
      window.removeEventListener('storage', updateUser);
      window.removeEventListener('user-login', updateUser);
      window.removeEventListener('cart-updated', fetchCartCount);
    };
  }, [fetchCartCount]);

  if (!hasMounted) {
    return (
      <nav className="flex justify-between p-4 bg-gray-100">
        <Link href="/">Logo</Link>
        <div className="border rounded p-1 w-32 bg-gray-200 animate-pulse" />
        <div className="flex gap-4 items-center">
          <div className="w-16 h-4 bg-gray-200 animate-pulse" />
        </div>
      </nav>
    );
  }

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('user-login'));
    // Optionally call API to invalidate session
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
    router.refresh();
  };

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.push(`/products?search=${searchQuery}`);
    }
  };

  return (
    <nav className="flex justify-between p-4 bg-gray-100">
      <Link href="/">Logo</Link>
      <input
        type="text"
        placeholder="搜尋商品..."
        className="border rounded p-1"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleSearch}
      />
      <div className="flex gap-4 items-center">
        <Link href="/cart">🛒 購物車 {cartCount > 0 && (<span data-testid="cart-badge">{cartCount}</span>)}</Link>
        <Link href="/products">商品</Link>
        <Link href="/order-tracking">訂單追蹤</Link>
        {user ? (
          <React.Fragment key="user-actions">
            <span>👋 歡迎，{user.name || user.email || '會員'}</span>
            <Link href="/profile/orders">我的訂單</Link>
            <button onClick={handleLogout} className="text-red-500">登出</button>
          </React.Fragment>
        ) : (
          <React.Fragment key="guest-actions">
            <Link href="/login">會員登入</Link>
          </React.Fragment>
        )}
      </div>
    </nav>
  );
}
