'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

// 由於是 tRPC 透過 HTTP 呼叫，直接定義對應的型別
interface Product {
  id: string;
  sku: string;
  title: string;
  description: string | null;
  price: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  inventory: { availableStock: number } | null;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // 模擬 tRPC 呼叫，實際應整合 tRPC client
      const data = await apiFetch<{ products: Product[] }>(`/trpc/adminProducts.getAdminProducts?batch=1&input=${encodeURIComponent(JSON.stringify({ status: statusFilter === 'ALL' ? undefined : statusFilter }))}`);
      setProducts(data.products);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [statusFilter]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">新增商品</button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded ${statusFilter === status ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <p>載入中...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">名稱</th>
              <th className="border p-2">價格</th>
              <th className="border p-2">庫存</th>
              <th className="border p-2">狀態</th>
              <th className="border p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="border p-2">{product.title}</td>
                <td className="border p-2">{product.price}</td>
                <td className="border p-2">{product.inventory?.availableStock ?? 0}</td>
                <td className="border p-2">{product.status}</td>
                <td className="border p-2">
                  <button className="text-blue-600 mr-2">編輯</button>
                  <button className="text-red-600">封存</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
