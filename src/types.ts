// src/types.ts
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
  isBot?: boolean;
  is_valid?: boolean;
  isLoading?: boolean;
  isPlaceholder?: boolean;
}

export interface PortfolioItem {
  id: string;
  giftId: string;
  giftName: string;
  giftImage: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: Date;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export type TabType = 'market' | 'portfolio';
