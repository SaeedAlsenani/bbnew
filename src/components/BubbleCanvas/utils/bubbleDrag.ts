import * as d3 from 'd3';

export const setupDragBehavior = (bubbleGroup: d3.Selection<d3.BaseType, any, d3.BaseType, unknown>, simulation: d3.Simulation<any, undefined>) => {
    const drag = d3.drag<SVGGElement, any>()
        .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        })
        .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
        })
        .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        });

    bubbleGroup.call(drag);
};
