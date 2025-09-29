import * as d3 from 'd3';
import { Gift } from './bubbleTypes';

export const BUBBLE_CONFIG = {
    minRadiusFactor: 0.03,
    maxRadiusFactor: 0.15,
    targetCoverage: 0.65,
    botRadiusFactor: 0.6
};

export const calculateBubbleSizes = (data: Gift[], width: number, height: number, targetCoverage: number = BUBBLE_CONFIG.targetCoverage) => {
    const totalArea = width * height;
    const minRadius = Math.min(width, height) * BUBBLE_CONFIG.minRadiusFactor;
    const maxRadius = Math.min(width, height) * BUBBLE_CONFIG.maxRadiusFactor;

    // البحث الثنائي لإيجاد الحجم المناسب (مثل Gift Bubbles)
    let low = 1e-6;
    let high = 1000;
    let result: any[] = [];

    for (let i = 0; i < 30; i++) {
        const mid = (low + high) / 2;
        
        const bubbles = data.map(item => {
            const value = Math.abs(item.market_cap) || Math.abs(item.current_price) || 1;
            const radius = Math.min(maxRadius, Math.max(minRadius, Math.sqrt(mid * value)));
            return { 
                ...item, 
                r: radius,
                value: item.price_change_percentage_24h || 0
            };
        });

        const coverage = d3.sum(bubbles, (d: any) => Math.PI * d.r * d.r) / totalArea;
        
        if (Math.abs(coverage - targetCoverage) < 0.01) {
            result = bubbles;
            break;
        }
        
        if (coverage > targetCoverage) {
            high = mid;
        } else {
            low = mid;
        }
        result = bubbles;
    }

    return result;
};

export const createBotBubble = (nodes: any[], width: number, height: number) => {
    const maxRadius = d3.max(nodes, (d: any) => d.r) || 50;
    const botRadius = maxRadius * BUBBLE_CONFIG.botRadiusFactor;

    return {
        id: 'gift_graphs_bot',
        name: 'Gift Graphs Bot',
        symbol: '@GiftGraphsBot',
        image: '',
        isBot: true,
        r: botRadius,
        market_cap: 0,
        current_price: 0,
        price_change_percentage_24h: 0,
        model_name: 'Telegram Bot',
        min_price_ton: 0,
        min_price_usd: 0,
        x: width / 2,
        y: height / 2,
        value: 0
    };
};
