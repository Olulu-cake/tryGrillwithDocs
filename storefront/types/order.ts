export interface Order {
  id: string;
  userId?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  receiverName?: string;
  receiverPhone?: string;
  receiver?: {
    name?: string;
    phone?: string;
  };
  shippingAddress?: string;
  totalAmount: number;
  total?: number;
  status: 'PAID' | 'PENDING';
  createdAt: string;
  items: any[];
}
