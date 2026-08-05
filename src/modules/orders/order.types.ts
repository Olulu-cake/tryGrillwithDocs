export interface BuyerInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface ReceiverInfo {
  name: string;
  phone?: string;
  shippingAddress: string;
}

export interface OrderItemSnapshot {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId?: string;
  buyer: BuyerInfo;
  receiver: ReceiverInfo;
  items: OrderItemSnapshot[];
  totalAmount: number;
  status: 'PAID' | 'PENDING';
  createdAt: string;
}

export interface CreateOrderDTO {
  buyer: BuyerInfo;
  receiver: ReceiverInfo;
}
