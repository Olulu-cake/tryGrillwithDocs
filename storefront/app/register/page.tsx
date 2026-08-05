'use client';

export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/src/utils/trpc';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError('');
    try {
      const data = await trpc.auth.register.mutate({ email, password, name }) as any;
      
      if (data) {
        const resUser = data.user || data;
        const userToSave = {
          ...resUser,
          name: resUser.name || name || email.split('@')[0]
        };
        localStorage.setItem('user', JSON.stringify(userToSave));
      }
      window.dispatchEvent(new Event('user-login'));
      router.push('/');
    } catch (err: any) {
      setError(err.message || '註冊失敗');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">註冊</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <input type="text" placeholder="Name" className="border p-2 w-full mb-2" value={name} onChange={e => setName(e.target.value)} />
      <input type="email" placeholder="Email" className="border p-2 w-full mb-2" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" className="border p-2 w-full mb-2" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" className="bg-blue-500 text-white p-2 w-full" disabled={isPending}>
        {isPending ? '註冊中...' : '註冊'}
      </button>
    </form>
  );
}
