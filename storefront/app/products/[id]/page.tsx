'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProductById } from '@/services/product.service';
import { Product } from '@/types/product';
import { apiFetchRaw } from '@/lib/api';

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    getProductById(id)
      .then((data) => {
        setProduct(data as Product);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = async () => {
    try {
      const targetId = (product as any).id || (product as any)._id || (product as any).productId || id;
      const payload = {
        productId: targetId,
        quantity: Number(quantity) || 1
      };
      
      console.log('[Add To Cart] Sending Payload:', payload);

      const response = await apiFetchRaw('/cart/items', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      console.log('[Frontend AddToCart Response]:', resData);

      if (!response.ok) {
        throw new Error(resData.message || 'Failed to add to cart');
      }

      window.dispatchEvent(new Event('cart-updated'));
      setMessage('Successfully added to cart!');
      setTimeout(() => setMessage(null), 3000);
      return true;
    } catch (error: any) {
      console.error('[Frontend AddToCart Error]:', error);
      setMessage(error.message || 'Failed to add to cart. Please try again.');
      return false;
    }
  };

  const handleBuyNow = async () => {
    const success = await handleAddToCart();
    if (success) {
      router.push('/checkout');
    }
  };

  if (loading) return <div className="container mx-auto p-4">Loading...</div>;
  if (error) return <div className="container mx-auto p-4 text-red-600">Error: {error}</div>;
  if (!product) return <div className="container mx-auto p-4">Product not found</div>;

  const { title, description, price, inventory } = product;
  const availableStock = inventory?.availableStock ?? 0;
  const isAvailable = availableStock > 0;

  return (
    <div className="container mx-auto p-4">
      {message && <div className="bg-blue-100 text-blue-800 p-2 mb-4 rounded">{message}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="bg-gray-200 aspect-square rounded-lg"></div>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{title}</h1>
          <p className="text-xl text-gray-700 mb-4">${price.toString()}</p>
          <p className="mb-4">{description || 'No description available.'}</p>
          <div className="mb-4">
            <span className={`px-2 py-1 rounded ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isAvailable ? `有現貨 (庫存數量: ${availableStock})` : '缺貨中'}
            </span>
          </div>
          
          {isAvailable && (
            <div className="mb-4">
              <label className="block mb-2">Quantity:</label>
              <input
                type="number"
                min="1"
                max={availableStock}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border p-2 rounded"
              />
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={handleAddToCart}
              className="bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
              disabled={!isAvailable}
            >
              Add to Cart
            </button>
            <button 
              onClick={handleBuyNow}
              className="bg-green-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
              disabled={!isAvailable}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
