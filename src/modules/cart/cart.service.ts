import { catalogService } from '../catalog/catalog.service';
import { CartDTO, CartItemDTO } from './cart.types';

interface CartItem {
  productId: string;
  quantity: number;
}

export class CartStore {
  private carts: Map<string, CartItem[]> = new Map();

  async getCart(cartId: string): Promise<CartDTO> {
    const items = this.carts.get(cartId) || [];

    const itemsPromise = items.map(async (cartItem) => {
      const product = await catalogService.getProductById(cartItem.productId);
      if (!product) return null;

      const price = Number(product.price);
      return {
        productId: cartItem.productId,
        title: product.title,
        price: price,
        quantity: cartItem.quantity,
        subtotal: price * cartItem.quantity,
        stock: product.inventory?.availableStock || 0,
      };
    });

    const populatedItems = await Promise.all(itemsPromise);
    const validItems: CartItemDTO[] = populatedItems.filter(
      (item): item is CartItemDTO => item !== null
    );

    const totalQuantity = validItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = validItems.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      items: validItems,
      totalQuantity,
      totalAmount,
    };
  }

  async addItem(cartId: string, productId: string, quantity: number): Promise<void> {
    const product = await catalogService.getProductById(productId);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    const cart = this.carts.get(cartId) || [];
    const item = cart.find(i => i.productId === productId);
    const currentQuantity = item ? item.quantity : 0;
    const requestedTotal = currentQuantity + quantity;
    const availableStock = product.inventory?.availableStock || 0;

    if (requestedTotal > availableStock) {
      const error: any = new Error('INSUFFICIENT_STOCK');
      error.status = 400;
      throw error;
    }

    if (item) {
      item.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }
    this.carts.set(cartId, cart);
  }

  async updateQuantity(cartId: string, productId: string, quantity: number): Promise<void> {
    const product = await catalogService.getProductById(productId);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    const availableStock = product.inventory?.availableStock || 0;
    if (quantity > availableStock) {
      const error: any = new Error('INSUFFICIENT_STOCK');
      error.status = 400;
      throw error;
    }

    const cart = this.carts.get(cartId) || [];
    const item = cart.find(i => i.productId === productId);
    if (item) {
      item.quantity = quantity;
    }
    this.carts.set(cartId, cart);
  }

  removeItem(cartId: string, productId: string): void {
    const cart = this.carts.get(cartId) || [];
    const newCart = cart.filter(i => i.productId !== productId);
    this.carts.set(cartId, newCart);
  }

  clearCart(cartId: string): void {
    this.carts.delete(cartId);
  }

  async mergeCart(guestId: string, userId: string): Promise<void> {
    const guestCart = this.carts.get(guestId) || [];
    const userCart = this.carts.get(userId) || [];

    for (const item of guestCart) {
      const existingItem = userCart.find(i => i.productId === item.productId);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        userCart.push(item);
      }
    }

    this.carts.set(userId, userCart);
    this.carts.delete(guestId);
  }
}

declare global {
  var __cartStore: CartStore | undefined;
}

export const cartService = globalThis.__cartStore ?? new CartStore();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__cartStore = cartService;
}
