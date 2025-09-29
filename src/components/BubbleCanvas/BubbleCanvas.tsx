import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useBubbleTooltip } from './hooks/useBubbleTooltip';
import { calculateBubbleSizes, createBotBubble, processBubbleData } from './utils/bubbleLayout';
import { createEnhancedSimulation } from './utils/bubbleForces';
import { setupDragBehavior } from './utils/bubbleDrag';
import { createGradients, drawBubbles } from './renderers/bubbleRenderer';
import { BubbleCanvasProps } from './types/bubbleTypes';

const BubbleCanvas: React.FC<BubbleCanvasProps> = ({ 
    cryptoData = [], 
    loading = false, 
    selectedCryptos = [], 
    sortMethod = 'marketCap', 
    timePeriod = '24h',
    onBubbleClick 
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const { tooltipRef, hoverTimeoutRef, setupTooltips } = useBubbleTooltip();

    // إعداد الأبعاد والاستجابة
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                }
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // منطق الفقاعات المحسن من Gift Bubbles
    useEffect(() => {
        if (!cryptoData.length || loading || !svgRef.current) {
            if (simulationRef.current) {
                simulationRef.current.stop();
            }
            return;
        }

        // إيقاف المحاكاة السابقة
        if (simulationRef.current) {
            simulationRef.current.stop();
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const { width, height } = dimensions;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const contentWidth = width - margin.left - margin.right;
        const contentHeight = height - margin.top - margin.bottom;

        // تصفية البيانات المحددة
        const filteredData = selectedCryptos.length 
            ? cryptoData.filter(d => selectedCryptos.includes(d.id))
            : cryptoData;

        if (filteredData.length === 0) {
            simulationRef.current = null;
            return;
        }

        // فرز البيانات
        let sortedData = [...filteredData];
        if (sortMethod === 'marketCap') {
            sortedData.sort((a, b) => b.market_cap - a.market_cap);
        } else if (sortMethod === 'priceChange') {
            sortedData.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
        }

        // ⬇️ معالجة البيانات حسب الفترة الزمنية
        const processedData = processBubbleData(sortedData, timePeriod);
        
        // ⬇️ حساب أحجام الفقاعات باستخدام البيانات المعالجة
        const nodes = calculateBubbleSizes(processedData, contentWidth, contentHeight);
        
        // إضافة فقاعة البوت (مثل Gift Bubbles)
        const botBubble = createBotBubble(nodes, contentWidth, contentHeight);
        nodes.push(botBubble);

        // إنشاء المحاكاة الفيزيائية المحسنة - بدون قوة الجذب إلى الوسط
        const simulation = createEnhancedSimulation(nodes, contentWidth, contentHeight);
        simulationRef.current = simulation;

        // إنشاء التدرجات اللونية المحسنة
        createGradients(svg);

        // إنشاء مجموعات الفقاعات
        const bubbleGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .selectAll('.bubble')
            .data(nodes, (d: any) => d.id)
            .join('g')
            .attr('class', 'bubble')
            .attr('transform', (d: any) => `translate(${d.x || contentWidth/2}, ${d.y || contentHeight/2})`);

        // إعداد التحديثات أثناء المحاكاة
        simulation.on('tick', () => {
            d3.select(svgRef.current)
                .selectAll('.bubble')
                .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
        });

        // إضافة سلوك السحب (مثل Gift Bubbles)
        setupDragBehavior(bubbleGroup, simulation);

        // رسم الفقاعات مع التصميم المحسن
        drawBubbles(bubbleGroup, svg, onBubbleClick);

        // إعداد التلميحات (مثل Gift Bubbles)
        setupTooltips(bubbleGroup, hoverTimeoutRef);

        return () => {
            if (simulationRef.current) {
                simulationRef.current.stop();
            }
        };
    }, [cryptoData, loading, selectedCryptos, sortMethod, timePeriod, dimensions, onBubbleClick, setupTooltips]);

    // حالة التحميل المحسنة
    if (loading) {
        return (
            <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mx-auto mb-4"></div>
                    <div className="text-cyan-200 text-lg font-semibold">Loading Gift Graphs...</div>
                    <div className="text-gray-400 text-sm">Preparing bubble visualization</div>
                </div>
            </div>
        );
    }

    if (!cryptoData.length) {
        return (
            <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="text-center">
                    <div className="text-cyan-200 text-xl font-semibold mb-2">No Data Available</div>
                    <div className="text-gray-400">Select cryptocurrencies to visualize</div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <svg 
                ref={svgRef} 
                className="w-full h-full"
                width="100%" 
                height="100%"
            />
            
            {/* تلميخ خارج SVG (مثل Gift Bubbles) */}
            <div 
                ref={tooltipRef}
                className="absolute pointer-events-none bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg border border-cyan-500/30 shadow-2xl opacity-0 transition-opacity z-50 max-w-xs"
                style={{ 
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.4'
                }}
            />
        </div>
    );
};

export default BubbleCanvas;
