'use client';

export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError('');

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '登入失敗，請檢查帳號密碼');
      }

      const data = await response.json();

      // 判斷登入成功
      if (data.success || data.user) {
        const resUser = data.user;
        const userToSave = {
          ...resUser,
          name: resUser.name || email.split('@')[0]
        };
        // 儲存 user 資料
        localStorage.setItem('user', JSON.stringify(userToSave));
        
        // 廣播事件
        window.dispatchEvent(new Event('user-login'));

        // 成功提示與跳轉
        alert('登入成功！');
        router.push('/profile/orders');
      } else {
        throw new Error('登入回應格式錯誤');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || '登入失敗，請檢查帳號密碼');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">登入</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <input 
        type="email" 
        placeholder="Email" 
        className="border p-2 w-full mb-2" 
        value={email} 
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input 
        type="password" 
        placeholder="Password" 
        className="border p-2 w-full mb-2" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
        required
      />
      <button 
        type="submit" 
        className="bg-blue-500 text-white p-2 w-full disabled:opacity-50" 
        disabled={isPending}
      >
        {isPending ? '登入中...' : '登入'}
      </button>
    </form>
  );
}
