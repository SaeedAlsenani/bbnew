import * as d3 from 'd3';

export const createGradients = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const defs = svg.append('defs');

    // تدرج أخضر للقيم الإيجابية
    const greenGradient = defs.append('radialGradient')
        .attr('id', 'bubble-green');
    greenGradient.append('stop').attr('offset', '60%').attr('stop-color', 'black');
    greenGradient.append('stop').attr('offset', '100%').attr('stop-color', '#009900');

    // تدرج أحمر للقيم السلبية
    const redGradient = defs.append('radialGradient')
        .attr('id', 'bubble-red');
    redGradient.append('stop').attr('offset', '60%').attr('stop-color', 'black');
    redGradient.append('stop').attr('offset', '100%').attr('stop-color', '#990000');

    // تدرج أزرق للبوت (مثل Gift Bubbles)
    const blueGradient = defs.append('radialGradient')
        .attr('id', 'bubble-blue');
    blueGradient.append('stop').attr('offset', '60%').attr('stop-color', 'black');
    blueGradient.append('stop').attr('offset', '100%').attr('stop-color', '#39719f');
};

export const drawBubbles = (bubbleGroup: d3.Selection<d3.BaseType, any, d3.BaseType, unknown>, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, onBubbleClick: (data: any) => void) => {
    // الدوائر الرئيسية
    bubbleGroup.append('circle')
        .attr('r', (d: any) => d.r)
        .attr('fill', (d: any) => {
            if (d.isBot) return 'url(#bubble-blue)';
            return (d.value >= 0) ? 'url(#bubble-green)' : 'url(#bubble-red)';
        })
        .attr('stroke', (d: any) => d.isBot ? '#4f90c6' : (d.value >= 0 ? '#3cb371' : '#dc143c'))
        .attr('stroke-width', (d: any) => Math.max(1, d.r * 0.05));

    // حدود التمرير (مثل Gift Bubbles)
    bubbleGroup.append('circle')
        .attr('class', 'hover-outline')
        .attr('r', (d: any) => d.r)
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', (d: any) => Math.max(1, d.r * 0.05))
        .style('opacity', 0);

    // الصور (للعناصر غير البوت)
    bubbleGroup.filter((d: any) => !d.isBot && d.image)
        .append('image')
        .attr('href', (d: any) => d.image)
        .attr('x', (d: any) => -d.r * 0.6)
        .attr('y', (d: any) => -d.r * 0.6)
        .attr('width', (d: any) => d.r * 1.2)
        .attr('height', (d: any) => d.r * 1.2)
        .attr('clip-path', (d: any) => `url(#clip-${d.id})`);

    // إنشاء أقنعة القص للصور
    const defs = svg.select('defs');
    bubbleGroup.filter((d: any) => !d.isBot && d.image)
        .each(function(d: any) {
            defs.append('clipPath')
                .attr('id', `clip-${d.id}`)
                .append('circle')
                .attr('r', d.r * 0.6);
        });

    // النصوص
    bubbleGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#ffffff')
        .style('font-size', (d: any) => `${d.r * 0.2}px`)
        .style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text((d: any) => d.isBot ? d.symbol : d.symbol.toUpperCase());

    // النسبة المئوية للقيمة
    bubbleGroup.filter((d: any) => !d.isBot)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('dy', (d: any) => d.r * 0.4)
        .attr('fill', (d: any) => d.value >= 0 ? '#4ade80' : '#f87171')
        .style('font-size', (d: any) => `${d.r * 0.15}px`)
        .style('pointer-events', 'none')
        .text((d: any) => {
            const sign = d.value >= 0 ? '+' : '';
            return d.value ? `${sign}${d.value.toFixed(1)}%` : '0.0%';
        });

    // معالجة النقر
    bubbleGroup.on('click', (event, d: any) => {
        onBubbleClick(d);
        
        // تأثير النقر (مثل Gift Bubbles)
        d3.select(event.currentTarget)
            .select('circle')
            .transition()
            .duration(200)
            .attr('r', d.r * 1.1)
            .transition()
            .duration(200)
            .attr('r', d.r);
    });
};
