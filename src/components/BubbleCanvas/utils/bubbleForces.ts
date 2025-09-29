import * as d3 from 'd3';
import { Gift } from '../types/bubbleTypes';

export const BUBBLE_CONFIG = {
    minRadiusFactor: 0.05,    // 5% من أصغر بُعد للشاشة
    maxRadiusFactor: 0.25,    // 25% من أصغر بُعد للشاشة
    targetCoverageMobile: 0.65,     // 65% تغطية مستهدفة للموبايل
    targetCoverageDesktop: 0.95,    // 95% تغطية مستهدفة للديسكتوب
    mobileBreakpoint: 768,    // حد الموبايل بالبكسل
    botRadiusFactor: 0.6      // البوت 60% من أكبر فقاعة
};

// ⬇️ دالة لتحديد نوع الجهاز والتغطية المستهدفة
export const getTargetCoverage = (width: number): number => {
    return width < BUBBLE_CONFIG.mobileBreakpoint 
        ? BUBBLE_CONFIG.targetCoverageMobile    // 65% للموبايل
        : BUBBLE_CONFIG.targetCoverageDesktop;  // 95% للديسكتوب
};

// ⬇️ دالة للحصول على القيمة حسب الفترة
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

// ⬇️ دالة لمعالجة البيانات حسب الفترة
export const processBubbleData = (data: Gift[], period: string = '24h'): any[] => {
    return data.map(item => ({
        ...item,
        displayValue: getValueByPeriod(item, period), // قيمة العرض للحجم
        value: item.price_change_percentage_24h || 0  // قيمة التلوين تبقى 24h
    }));
};

// ⬇️ دالة محسنة لحساب أحجام الفقاعات باستخدام البحث الثنائي مع تكيف الجهاز
export const calculateBubbleSizes = (
    data: any[], 
    width: number, 
    height: number, 
    customTargetCoverage?: number
) => {
    // تحديد التغطية المستهدفة تلقائياً حسب حجم الشاشة
    const targetCoverage = customTargetCoverage !== undefined 
        ? customTargetCoverage 
        : getTargetCoverage(width);
    
    const totalArea = width * height;
    const minRadius = Math.min(width, height) * BUBBLE_CONFIG.minRadiusFactor;
    const maxRadius = Math.min(width, height) * BUBBLE_CONFIG.maxRadiusFactor;
    
    let low = 1e-6;   // أدنى معامل
    let high = 1000;  // أعلى معامل
    let result: any[] = [];

    console.log(`🎯 حساب أحجام الفقاعات: ${width}x${height} | التغطية المستهدفة: ${(targetCoverage * 100).toFixed(0)}%`);

    // 30 تكرار للبحث الثنائي
    for (let i = 0; i < 30; i++) {
        const factor = (low + high) / 2;  // نقطة المنتصف
        
        const bubbles = data.map(item => {
            // استخدام القيمة المطلقة مع حد أدنى 0.1
            const value = Math.max(0.1, Math.abs(item.displayValue || item.value));
            
            // المعادلة: نصف القطر ∝ الجذر التربيعي(المعامل × القيمة)
            const radius = Math.min(maxRadius, Math.max(minRadius, Math.sqrt(factor * value)));
            
            return { 
                ...item, 
                r: radius,
                // الحفاظ على القيمة الأصلية للتلوين
                value: item.value
            };
        });

        // حساب إجمالي المساحة المشغولة
        const totalBubbleArea = d3.sum(bubbles, (d: any) => Math.PI * d.r * d.r);
        const coverage = totalBubbleArea / totalArea;

        // التحقق من التقارب
        if (Math.abs(coverage - targetCoverage) < 0.01) {
            console.log(`✅ تحقق التقارب بعد ${i + 1} تكرار | التغطية الفعلية: ${(coverage * 100).toFixed(1)}%`);
            result = bubbles;
            break;
        }

        // ضبط حدود البحث
        if (coverage > targetCoverage) {
            high = factor;  // مساحة كبيرة جداً ← خفض المعامل
        } else {
            low = factor;   // مساحة صغيرة ← زيادة المعامل
        }
        result = bubbles;
        
        // إذا كانت التكرار الأخير، عرض النتيجة النهائية
        if (i === 29) {
            console.log(`⚡ التغطية النهائية: ${(coverage * 100).toFixed(1)}% (المستهدف: ${(targetCoverage * 100).toFixed(0)}%)`);
        }
    }

    return result;
};

// ⬇️ دالة إنشاء فقاعة البوت
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

// ⬇️ دالة إنشاء المحاكاة مع التحجيم المحسن والتكيف مع الجهاز
export const createSimulation = (
    data: any[],
    width: number,
    height: number,
    period: string = '24h'
) => {
    // معالجة البيانات أولاً
    const processedData = processBubbleData(data, period);
    
    // حساب الأحجام باستخدام الخوارزمية المحسنة مع التكيف التلقائي
    const sizedData = calculateBubbleSizes(processedData, width, height);
    
    // إضافة فقاعة البوت
    const botBubble = createBotBubble(sizedData, width, height);
    const allNodes = [...sizedData, botBubble];

    // إنشاء المحاكاة مع الأحجام المحسوبة
    const simulation = d3.forceSimulation(allNodes)
        .force('charge', d3.forceManyBody()
            .strength((d: any) => {
                if (d.isBot) return -1000;  // طارد قوي للبوت
                return -50;  // قوة تنافر معتدلة للفقاعات الأخرى
            })
        )
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide()
            .radius((d: any) => d.r + 2)  // استخدام نصف القطر المحسوب + هامش
            .strength(0.8)
        )
        .force('x', d3.forceX(width / 2).strength(0.05))
        .force('y', d3.forceY(height / 2).strength(0.05));

    return simulation;
};

// ⬇️ دالة المساعدة لتحديث البيانات مع الحفاظ على المواقع الحالية
export const updateSimulationData = (
    simulation: d3.Simulation<any, undefined>,
    data: any[],
    width: number,
    height: number,
    period: string = '24h'
) => {
    // معالجة البيانات وحساب الأحجام الجديدة
    const processedData = processBubbleData(data, period);
    const sizedData = calculateBubbleSizes(processedData, width, height);
    
    // إضافة فقاعة البوت
    const botBubble = createBotBubble(sizedData, width, height);
    const allNodes = [...sizedData, botBubble];

    // تحديث المحاكاة مع البيانات الجديدة
    simulation.nodes(allNodes);
    
    // إعادة تطبيق القوى مع التحديثات
    simulation.force('collision', d3.forceCollide()
        .radius((d: any) => d.r + 2)
        .strength(0.8)
    );

    simulation.alpha(0.3).restart();
    return simulation;
};
