import { fetchApi } from '@/lib/api-client';

export const getProducts = async () => {
  return fetchApi<any[]>('/products');
};

export const getProductById = async (id: string) => {
  try {
    console.log(`Fetching product from: /api/products/${id}`);
    const product = await fetchApi<any>(`/products/${id}`);
    console.log('Fetched product:', product);
    return product;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};
