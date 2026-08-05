'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  return (
    <div className="max-w-md mx-auto p-8 text-center border rounded shadow-lg mt-10">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold mb-4">感謝您的購買！</h1>
      <p className="mb-6">
        您的訂單編號是：<span className="font-mono bg-gray-100 p-1 rounded">{orderId}</span>
      </p>
      <div className="space-y-3">
        <button 
          onClick={() => router.push(`/orders/${orderId}`)}
          className="w-full bg-blue-500 text-white py-2 rounded font-bold"
        >
          查看訂單明細
        </button>
        <button 
          onClick={() => router.push('/products')}
          className="w-full bg-gray-200 text-gray-800 py-2 rounded font-bold"
        >
          繼續購物
        </button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
