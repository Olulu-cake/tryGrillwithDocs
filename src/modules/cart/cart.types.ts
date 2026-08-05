export interface CartItemDTO {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
  imageUrl?: string;
}

export interface CartDTO {
  items: CartItemDTO[];
  totalQuantity: number;
  totalAmount: number;
}
