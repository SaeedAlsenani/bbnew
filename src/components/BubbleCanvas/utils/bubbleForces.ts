import * as d3 from 'd3';

export const createBoundaryForce = (width: number, height: number, strength: number = 0.2, padding: number = 20) => {
    let nodes: any[] = [];
    
    const force = () => {
        nodes.forEach((node: any) => {
            const boundary = node.r + padding;
            
            // منع الخروج من الحدود اليسرى
            if (node.x - boundary < 0) {
                node.vx += (boundary - node.x) * strength;
            } 
            // منع الخروج من الحدود اليمنى
            else if (node.x + boundary > width) {
                node.vx += (width - boundary - node.x) * strength;
            }
            
            // منع الخروج من الحدود العلوية
            if (node.y - boundary < 0) {
                node.vy += (boundary - node.y) * strength;
            } 
            // منع الخروج من الحدود السفلية
            else if (node.y + boundary > height) {
                node.vy += (height - boundary - node.y) * strength;
            }
        });
    };

    force.initialize = (newNodes: any[]) => {
        nodes = newNodes;
    };

    return force;
};

export const createEnhancedSimulation = (nodes: any[], width: number, height: number) => {
    const simulation = d3.forceSimulation(nodes)
        // ❌ تم إزالة: .force('center', d3.forceCenter(width / 2, height / 2))
        // ❌ تم إزالة: .force('x', d3.forceX(width / 2).strength(d => d.isBot ? 0.8 : 0.1))
        // ❌ تم إزالة: .force('y', d3.forceY(height / 2).strength(d => d.isBot ? 0.8 : 0.1))
        
        // ✅ تم الإبقاء على: قوة التصادم
        .force('collision', d3.forceCollide().radius((d: any) => d.r + 5).strength(0.8))
        
        // ✅ تم الإبقاء على: قوة التنافر
        .force('charge', d3.forceManyBody().strength((d: any) => -Math.pow(d.r, 1.5) * 0.3))
        
        // ✅ تم الإبقاء على: قوة الحدود من Gift Bubbles
        .force('boundary', createBoundaryForce(width, height, 0.2))
        
        .alphaDecay(0.02)
        .velocityDecay(0.4)
        .alphaTarget(0.1);

    return simulation;
};
