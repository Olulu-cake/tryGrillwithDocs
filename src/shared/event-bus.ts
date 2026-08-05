import { EventEmitter } from 'events';
import { contextStorage } from './context';

// 💡 遵循 ADR 0009：定義一個完全抽象、通用的核心事件契約，不依賴任何特定業務模組
export interface IEvent {
  type: string;     // 事件名稱，例如 'order.paid' 或 'shipment.tracking.updated'
  timestamp: Date;  // 事件發生時間
  payload: any;     // 具體的業務攜帶數據
  metadata?: {      // 💡 擴充：支持非同步邊界上下文傳遞
    correlationId?: string;
    traceId?: string;
  };
}

type EventHandler = (event: IEvent) => Promise<void> | void;

export class InMemoryEventBus {
  // 利用 Node.js 內建效能最高的 EventEmitter 核心
  private emitter = new EventEmitter();

  constructor() {
    // 根據團隊與生產環境併發吞吐量，放寬記憶體事件接聽上限（預設 10 超過會噴警報）
    this.emitter.setMaxListeners(50);
  }

  /**
   * 1. 訂閱全域事件
   */
  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    // 💡 透過事件線程接聽
    this.emitter.on(eventType, async (event: IEvent) => {
      // 💡 恢復非同步上下文
      await contextStorage.run(event.metadata || {}, async () => {
        try {
          await handler(event);
        } catch (error) {
          // 🛡️ 防禦性防護：即使某個業務監聽器在執行時崩潰（例如發信失敗），
          // 也絕對不會干擾並阻斷其他監聽器的執行或核心交易流轉！
          console.error(`[EventBus Error] Failed to handle event "${eventType}":`, error);
        }
      });
    });
  }

  /**
   * 2. 非同步廣播全域事件 (Agnostic Interface 核心)
   */
  async publish(event: IEvent): Promise<void> {
    // 💡 關鍵優化：自動注入當前上下文 (如果有的話)
    const context = contextStorage.getStore();
    event.metadata = {
      ...event.metadata,
      ...context,
    };

    // 💡 關鍵優化：利用 setImmediate 或 process.nextTick 將事件拋入 Node.js 事件循環的下一個 Tick 
    // 這能確保核心業務執行緒（如 Stripe Webhook 請求）能夠「0延遲、秒速」返回成功，而背景 Worker 監聽器會在記憶體非同步排隊執行！
    setImmediate(() => {
      this.emitter.emit(event.type, event);
    });
  }
}

// 🚀 導出套用單例模式（Singleton）的 eventBus 實例，確保全系統在 Runtime 共享同一個記憶體通道
export const eventBus = new InMemoryEventBus();