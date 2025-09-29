import * as d3 from 'd3';
import { Gift } from '../types/bubbleTypes';

export const BUBBLE_CONFIG = {
    minRadiusFactor: 0.03,
    maxRadiusFactor: 0.15,
    targetCoverage: 0.65,
    botRadiusFactor: 0.6
};

// ⬇️ دالة جديدة للحصول على القيمة حسب الفترة
export const getValueByPeriod = (item: Gift, period: string): number => {
    switch (period) {
        case '7d':
            return item.change_7d || item.price_change_percentage_24h || 0;
        case '30d':
            return item.change_30d || item.price_change_percentage_24h || 0;
        case 'marketCap':
            return item.market_cap || 0;
        default: // '24h'
            return item.price_change_percentage_24h || 0;
    }
};

// ⬇️ دالة جديدة لمعالجة البيانات حسب الفترة
export const processBubbleData = (data: Gift[], period: string = '24h'): any[] => {
    return data.map(item => ({
        ...item,
        displayValue: getValueByPeriod(item, period), // قيمة العرض
        value: item.price_change_percentage_24h || 0  // قيمة التلوين تبقى 24h
    }));
};

// ⬇️ دالة حساب الأسعار المحسنة
export const calculateBubbleSizes = (data: any[], width: number, height: number, targetCoverage: number = BUBBLE_CONFIG.targetCoverage) => {
    const totalArea = width * height;
    const minRadius = Math.min(width, height) * BUBBLE_CONFIG.minRadiusFactor;
    const maxRadius = Math.min(width, height) * BUBBLE_CONFIG.maxRadiusFactor;

    let low = 1e-6;
    let high = 1000;
    let result: any[] = [];

    for (let i = 0; i < 30; i++) {
        const mid = (low + high) / 2;
        
        const bubbles = data.map(item => {
            // ⬇️ استخدام القيمة المطلقة للتغير (سواء موجب أو سالب)
            const changeValue = Math.abs(item.displayValue) || 1;
            // ⬇️ التأكد من أن القيمة لا تقل عن 0.1 لتجنب الفقاعات الصغيرة جداً
            const normalizedValue = Math.max(0.1, changeValue);
            const radius = Math.min(maxRadius, Math.max(minRadius, Math.sqrt(mid * normalizedValue)));
            
            return { 
                ...item, 
                r: radius,
                // ⬇️ الحفاظ على قيمة التلوين الأصلية
                value: item.value
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
        value: 0,
        displayValue: 0
    };
};
