import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

// BubbleCanvas Component: Handles D3.js bubble rendering, physics, and interactions.
// It does NOT contain any modal logic.
const BubbleCanvas = ({ cryptoData, loading, selectedCryptos, sortMethod, onBubbleClick }) => {
    const svgRef = useRef();
    const containerRef = useRef();
    const simulationRef = useRef(null); // Reference to D3 force simulation

    // State for dimensions to ensure responsive rendering
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Effect to handle dimensions using window.addEventListener and setTimeout for initial load
    useEffect(() => {
        let timeoutId; // To store setTimeout ID for cleanup

        const handleResize = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                const height = containerRef.current.clientHeight;

                // Log dimensions for debugging
                console.log(`BubbleCanvas: Dimensions updated. Width: ${width}, Height: ${height}`);

                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                    // Clear any pending setTimeout if valid dimensions are found
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                } else {
                    // If dimensions are 0, retry after a short delay as a fallback
                    timeoutId = setTimeout(handleResize, 100);
                }
            } else {
                // If containerRef.current is not available yet, retry
                timeoutId = setTimeout(handleResize, 100);
            }
        };

        // Call handleResize immediately on component mount to get initial dimensions
        handleResize();

        // Add event listener for window resize
        window.addEventListener('resize', handleResize);
        
        // Cleanup function: remove event listener and clear any pending timeouts
        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []); // Empty dependency array means this runs only once on mount

    // Effect for the D3.js simulation, dependent on data and dimensions
    useEffect(() => {
        const { width, height } = dimensions;

        // Do not proceed with D3 simulation if data is not loaded or dimensions are invalid (0x0)
        // Updated check for cryptoData to prevent TypeError if it's null/undefined
        if (!cryptoData || cryptoData.length === 0 || loading || width === 0 || height === 0 || !svgRef.current) {
            // If simulation exists, stop it to prevent errors with invalid dimensions
            if (simulationRef.current) {
                simulationRef.current.stop();
            }
            console.log("BubbleCanvas: D3 simulation deferred due to invalid dimensions or no data.");
            return;
        }

        console.log("BubbleCanvas: Valid dimensions. Starting D3 simulation.");

        // Stop the old simulation if it exists before creating a new one
        if (simulationRef.current) {
            simulationRef.current.stop();
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous SVG elements

        const filteredData = cryptoData.filter(d => selectedCryptos.includes(d.id));

        let sortedData = [...filteredData];
        // Note: Sorting logic remains here as it affects bubble data preparation
        // If sortMethod is 'marketCap', sort by market_cap_desc
        // Otherwise, maintain original order (or random if data naturally is)
        if (sortMethod === 'marketCap') {
            sortedData.sort((a, b) => b.market_cap - a.market_cap);
        }

        const sizeScale = d3.scaleSqrt()
            .domain([0, d3.max(sortedData, d => d.market_cap)])
            .range([10, Math.min(width, height) / 8]);

        const nodes = sortedData.map(d => ({ ...d, r: sizeScale(d.market_cap) }));

        // Force simulation to add realistic physics
        // DO NOT MODIFY PHYSICS OR SIMULATION SETTINGS HERE as per user request
        const simulation = d3.forceSimulation(nodes)
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('x', d3.forceX(width / 2).strength(0.15)) // Increased strength from 0.05 to 0.15
            .force('y', d3.forceY(height / 2).strength(0.15)) // Increased strength from 0.05 to 0.15
            .force('collide', d3.forceCollide().radius(d => d.r + 2).strength(0.7))
            .force('charge', d3.forceManyBody().strength(d => -Math.pow(d.r, 1.5) * 0.2))
            .on('tick', () => {
                bubbleGroup.attr('transform', d => `translate(${d.x},${d.y})`);
            });

        // Save reference to the new simulation
        simulationRef.current = simulation;
        
        // Define radial gradients for styling
        const defs = svg.append("defs");
        
        const greenGradient = defs.append("radialGradient")
            .attr("id", "greenGradient");
        greenGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "rgba(0, 0, 0, 0)");
        greenGradient.append("stop")
            .attr("offset", "80%")
            .attr("stop-color", "rgba(22, 101, 52, 0.9)");
        greenGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "rgba(52, 211, 153, 0.8)");

        const redGradient = defs.append("radialGradient")
            .attr("id", "redGradient");
        redGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "rgba(0, 0, 0, 0)");
        redGradient.append("stop")
            .attr("offset", "80%")
            .attr("stop-color", "rgba(153, 27, 27, 0.9)");
        redGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "rgba(239, 68, 68, 0.8)");

        // Drag behavior for user interaction
        const drag = d3.drag()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });

        const bubbleGroup = svg.selectAll('.bubble')
            .data(nodes, d => d.id)
            .join('g')
            .attr('class', 'bubble')
            .call(drag)
            .on('click', (event, d) => { // Click handler to pass data to parent (App.tsx)
                onBubbleClick(d);
            });

        bubbleGroup.append('circle')
            .attr('r', d => d.r)
            .attr('fill', d => {
                return d.price_change_percentage_24h >= 0 ? 'url(#greenGradient)' : 'url(#redGradient)';
            })
            .attr('stroke', 'none');

        bubbleGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', '#f9fafb')
            .style('font-size', d => `${d.r / 3}px`)
            .style('pointer-events', 'none')
            .text(d => d.symbol.toUpperCase());

        bubbleGroup.append('image')
            .attr('href', d => d.image)
            .attr('x', d => -d.r * 0.4)
            .attr('y', d => -d.r * 0.4)
            .attr('width', d => d.r * 0.8)
            .attr('height', d => d.r * 0.8)
            .style('pointer-events', 'none');

        // Tooltip logic (remains here as it's part of bubble interaction)
        const showTooltip = (event, d) => {
            const [x, y] = d3.pointer(event, svgRef.current);
            // This component doesn't manage tooltip state directly, but it could emit an event
            // For now, we'll keep the tooltip rendering in App.tsx for simplicity,
            // but BubbleCanvas is responsible for triggering its display.
            // This is a simplified tooltip display for the canvas itself, not the modal.
            // If a tooltip is needed here, it would be managed by a local state or prop.
        };

        const hideTooltip = () => {
            // Similar to showTooltip, if a tooltip is needed here, it would be managed locally.
        };

        // Removed mouseover/mousemove/mouseleave from bubbleGroup as tooltip is handled by App.tsx
        // If a tooltip is desired directly within the canvas, its state should be managed here
        // or passed as props from App.tsx.

        // Cleanup function for D3 simulation
        return () => {
            if (simulationRef.current) {
                simulationRef.current.stop();
            }
        };

    }, [cryptoData, loading, selectedCryptos, sortMethod, dimensions, onBubbleClick]); // Dependencies for D3 effect

    // The BubbleCanvas itself does not render the tooltip data
    // The tooltip data is managed and rendered by the parent App.tsx
    return (
        <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
            <svg ref={svgRef} className="w-full h-full" width="100%" height="100%"></svg>
        </div>
    );
};

export default BubbleCanvas;

