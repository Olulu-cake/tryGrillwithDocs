import { eventBus } from '../../../shared/event-bus';

export class FulfillmentSubscriber {
  constructor() {
    this.init();
  }

  private init() {
    // 💡 訂閱 'order.paid' 事件，觸發物流準備流程
    eventBus.subscribe('order.paid', async (event) => {
      const { orderId } = event.payload;
      console.log(`[Fulfillment] Received order.paid event for order: ${orderId}. Starting shipping preparation...`);
      
      // TODO: 呼叫 ShippingProvider 建立標籤、更新資料庫等業務邏輯
      // 此處保證是非同步觸發，不會擋住 OrderService 的返回
    });
  }
}
