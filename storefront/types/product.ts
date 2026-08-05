export interface Inventory {
  availableStock: number;
  reservedStock: number;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  inventory: Inventory | null;
}
