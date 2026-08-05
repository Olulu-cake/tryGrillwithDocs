import { fetchApi } from "@/lib/api-client";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

interface Product {
  id: string;
  title: string;
  price: number;
}

async function getProducts(): Promise<Product[]> {
  try {
    const resData = await fetchApi<any>('/catalog');
    // Defensive parsing: priority to resData.products, then check if resData itself is Array
    return Array.isArray(resData?.products) 
      ? resData.products 
      : (Array.isArray(resData) ? resData : []);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export default async function Home() {
  const products = await getProducts();
  
  // Extra defensive check for JSX rendering
  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-8">Catalog</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {safeProducts.map((product) => (
          <div key={product.id} className="border p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold">{product.title}</h2>
            <p className="text-gray-600">${product.price}</p>
            <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Add to Cart</button>
          </div>
        ))}
      </div>
    </main>
  );
}
