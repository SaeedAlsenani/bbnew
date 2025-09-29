import { useRef, useCallback } from 'react';
import * as d3 from 'd3';

export const useBubbleTooltip = () => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const setupTooltips = useCallback((
        bubbleGroup: d3.Selection<d3.BaseType, any, d3.BaseType, unknown>, 
        timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
    ) => {
        bubbleGroup.on('mouseover', function(event, d: any) {
            if (d.isBot) return;

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                if (tooltipRef.current) {
                    const tooltip = d3.select(tooltipRef.current);
                    const sign = d.value >= 0 ? '+' : '';
                    
                    tooltip.html(`
                        <strong>${d.name}</strong><br/>
                        Symbol: ${d.symbol}<br/>
                        Price: $${d.current_price?.toFixed(2) || '0.00'}<br/>
                        Change: ${sign}${d.value?.toFixed(2)}%<br/>
                        Market Cap: $${(d.market_cap / 1e6).toFixed(1)}M
                    `)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY + 10}px`)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
                }

                // تأثير التمرير
                d3.select(this)
                    .select('.hover-outline')
                    .transition()
                    .duration(150)
                    .style('opacity', 1);
            }, 300);
        })
        .on('mousemove', function(event) {
            if (tooltipRef.current) {
                const tooltip = d3.select(tooltipRef.current);
                tooltip.style('left', `${event.pageX + 10}px`)
                      .style('top', `${event.pageY + 10}px`);
            }
        })
        .on('mouseout', function() {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            if (tooltipRef.current) {
                d3.select(tooltipRef.current)
                    .transition()
                    .duration(100)
                    .style('opacity', 0);
            }

            d3.select(this)
                .select('.hover-outline')
                .transition()
                .duration(200)
                .style('opacity', 0);
        });
    }, []);

    return {
        tooltipRef,
        hoverTimeoutRef,
        setupTooltips
    };
};
