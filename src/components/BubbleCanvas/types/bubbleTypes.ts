export interface Gift {
  id: string;
  model_name: string;
  variant_name?: string;
  min_price_ton: number;
  min_price_usd: number;
  image: string;
  name: string;
  symbol: string;
  market_cap: number;
  current_price: number;
  price_change_percentage_24h?: number;
  change_7d?: number;        // ⬅️ إضافة جديد
  change_30d?: number;       // ⬅️ إضافة جديد
  isBot?: boolean;
}

export interface BubbleCanvasProps {
  cryptoData?: Gift[];
  loading?: boolean;
  selectedCryptos?: string[];
  sortMethod?: string;
  timePeriod?: '24h' | '7d' | '30d' | 'marketCap'; // ⬅️ إضافة جديد
  onBubbleClick: (data: Gift) => void;
}

export interface BubbleNode extends Gift {
    r: number;
    x: number;
    y: number;
    vx?: number;
    vy?: number;
    fx?: number;
    fy?: number;
    value: number;
}
