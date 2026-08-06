'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { trpc } from '@/src/utils/trpc';
import { apiFetch } from '@/lib/api';

function ProductCard({ product, onAddToCart }: { product: any, onAddToCart: (product: any, quantity: number) => void }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <li className="border p-4 rounded" data-testid="product-item">
      <h2 className="text-xl font-semibold">{product.title}</h2>
      <p>${product.price}</p>
      <div className="flex items-center gap-2 mt-2">
        <label htmlFor={`quantity-${product.id}`} className="text-sm">數量:</label>
        <input 
          suppressHydrationWarning
          id={`quantity-${product.id}`}
          type="number" 
          min="1" 
          value={quantity} 
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
          className="border p-1 w-16"
        />
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('[DEBUG_ADD_TO_CART] Clicked button for product:', product?.id);
          onAddToCart(product, Number(quantity) || 1);
        }}
        className="bg-green-500 text-white mt-2 p-2 rounded w-full"
        data-testid="add-to-cart-btn"
      >
        加入購物車
      </button>
    </li>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await trpc.products.list.query({
          search: search || undefined,
          category: category || undefined,
          minPrice,
          maxPrice,
          sortBy: sortBy || undefined,
        });
        
        setProducts(data as any[]);
      } catch (e) {
        console.error('[Product Page] Failed to fetch products:', e);
        setError(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [search, category, minPrice, maxPrice, sortBy]);

  const [localSearch, setLocalSearch] = useState(search);
  const [localCategory, setLocalCategory] = useState(category);
  const [localSortBy, setLocalSortBy] = useState(sortBy);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice?.toString() || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice?.toString() || '');

  const applyFilters = () => {
    const query = new URLSearchParams();
    if (localSearch) query.append('search', localSearch);
    if (localCategory) query.append('category', localCategory);
    if (localSortBy) query.append('sortBy', localSortBy);
    if (localMinPrice) query.append('minPrice', localMinPrice);
    if (localMaxPrice) query.append('maxPrice', localMaxPrice);
    router.push(`/products?${query.toString()}`);
  };

  const handleAddToCart = async (product: any, qty: number = 1) => {
    const targetId = product?.id || product?._id || product?.productId || product;
    console.log('[DEBUG_ADD_TO_CART] Processing targetId:', targetId, 'qty:', qty);
    if (!targetId) return;

    await apiFetch('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId: targetId, quantity: Number(qty) || 1 })
    });
    window.dispatchEvent(new Event('cart-updated'));
  };

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="container mx-auto p-4 flex gap-8">
      <aside className="w-64 p-4 border rounded">
        <h2 className="text-xl font-bold mb-4">篩選器</h2>
        <input placeholder="搜尋..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="w-full border p-2 mb-2" />
        <input type="number" placeholder="最低價" value={localMinPrice} onChange={(e) => setLocalMinPrice(e.target.value)} className="w-full border p-2 mb-2" />
        <input type="number" placeholder="最高價" value={localMaxPrice} onChange={(e) => setLocalMaxPrice(e.target.value)} className="w-full border p-2 mb-2" />
        <select value={localSortBy} onChange={(e) => setLocalSortBy(e.target.value)} className="w-full border p-2 mb-4">
          <option value="newest">最新上架</option>
          <option value="price_asc">價格低到高</option>
          <option value="price_desc">價格高到低</option>
        </select>
        <button onClick={applyFilters} className="w-full bg-blue-500 text-white p-2 rounded">套用篩選</button>
      </aside>

      <main className="flex-1">
        <h1 className="text-2xl font-bold mb-4">商品列表</h1>
        {isLoading ? (
          <p>載入中...</p>
        ) : (
          <>
            {error && <p className="text-red-500 mb-4">載入商品失敗，請稍後再試。</p>}
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
              {!isLoading && safeProducts.length === 0 && !error && <p>目前沒有商品。</p>}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
