import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import FilterTabs from "./FilterTabs";
import GiftDetailModal from "./GiftDetailModal";

interface BubbleData {
  id: string;
  name: string;
  icon: string;
  percentChange: number;
  value: number;
  size: number;
}

interface BubblePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface BubbleProps {
  id: string;
  name: string;
  icon: string;
  percentChange: number;
  value: number;
  size: number;
  x: number;
  y: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: () => void;
  onTap: () => void;
}

// Enhanced Bubble component with performance optimizations
const Bubble: React.FC<BubbleProps> = ({
  id,
  name,
  icon,
  percentChange,
  value,
  size,
  x,
  y,
  isDragging,
  onDragStart,
  onDrag,
  onDragEnd,
  onTap,
}) => {
  const isPositive = percentChange >= 0;
  const baseColor = isPositive ? "0, 255, 0" : "255, 0, 0"; // green : red

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Dynamic gradient based on price movement with reduced glow intensity
  const gradientStyle = {
    background: `radial-gradient(circle at center, 
      rgba(0, 0, 0, 0.8) 0%, 
      rgba(0, 0, 0, 0.6) 40%, 
      rgba(${baseColor}, 0.2) 70%, 
      rgba(${baseColor}, 0.6) 85%, 
      rgba(${baseColor}, 0.8) 100%)`,
    // Reduced glow effect intensity
    boxShadow: prefersReducedMotion
      ? `0 0 ${size * 0.15}px rgba(${baseColor}, 0.4), inset 0 0 ${size * 0.05}px rgba(${baseColor}, 0.2)`
      : `0 0 ${size * 0.25}px rgba(${baseColor}, 0.5), 0 0 ${size * 0.15}px rgba(${baseColor}, 0.3), inset 0 0 ${size * 0.05}px rgba(${baseColor}, 0.2)`,
    border: `2px solid rgba(${baseColor}, 0.7)`,
  };

  const dragStartTimeRef = useRef<number>(0);
  const dragStartPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragStartTimeRef.current = Date.now();
      dragStartPositionRef.current = { x: e.clientX, y: e.clientY };
      hasDraggedRef.current = false;
      onDragStart();
    },
    [onDragStart],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();

        // Calculate drag distance to determine if this is a drag or tap
        const dragDistance = Math.sqrt(
          Math.pow(e.clientX - dragStartPositionRef.current.x, 2) +
            Math.pow(e.clientY - dragStartPositionRef.current.y, 2),
        );

        if (dragDistance > 5) {
          hasDraggedRef.current = true;
        }

        const containerRect = e.currentTarget
          .closest(".bubble-container")
          ?.getBoundingClientRect();
        if (containerRect) {
          const relativeX = e.clientX - containerRect.left;
          const relativeY = e.clientY - containerRect.top;
          onDrag(relativeX, relativeY);
        }
      }
    },
    [isDragging, onDrag],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        const dragDuration = Date.now() - dragStartTimeRef.current;
        const wasDragged = hasDraggedRef.current;

        onDragEnd();

        // Improved tap detection: quick release without significant movement
        if (dragDuration < 200 && !wasDragged) {
          setTimeout(() => onTap(), 0); // Defer tap to next frame
        }
      }
    },
    [isDragging, onDragEnd, onTap],
  );

  // Add click handler as fallback for tap detection
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging && !hasDraggedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onTap();
      }
    },
    [isDragging, onTap],
  );

  return (
    <div
      className={`absolute flex flex-col items-center justify-center cursor-pointer select-none touch-none ${isDragging ? "bubble-optimized" : "bubble-static"}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        ...gradientStyle,
        left: x - size / 2,
        top: y - size / 2,
        zIndex: isDragging ? 1000 : 1,
        transform: isDragging ? "scale(1.05)" : "scale(1)",
        transition:
          isDragging || prefersReducedMotion
            ? "none"
            : "transform 0.1s ease-out",
        willChange: isDragging ? "transform" : "auto",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
    >
      <div
        className="text-2xl mb-1 pointer-events-none"
        style={{
          textShadow: prefersReducedMotion ? "none" : "0 0 6px rgba(0,0,0,0.6)",
        }}
      >
        {icon}
      </div>
      <div
        className="text-xs text-white font-semibold pointer-events-none"
        style={{
          textShadow: prefersReducedMotion ? "none" : "0 0 4px rgba(0,0,0,0.6)",
        }}
      >
        {name}
      </div>
      <div
        className={`text-xs font-bold pointer-events-none ${isPositive ? "text-green-200" : "text-red-200"}`}
        style={{
          textShadow: prefersReducedMotion ? "none" : "0 0 4px rgba(0,0,0,0.6)",
        }}
      >
        {isPositive ? "+" : ""}
        {percentChange.toFixed(2)}%
      </div>
      <div
        className="text-xs text-white pointer-events-none"
        style={{
          textShadow: prefersReducedMotion ? "none" : "0 0 4px rgba(0,0,0,0.6)",
        }}
      >
        {value}
      </div>
    </div>
  );
};

interface BubbleSimulationProps {
  data?: BubbleData[];
}

const BubbleSimulation: React.FC<BubbleSimulationProps> = ({ data = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [positions, setPositions] = useState<Record<string, BubblePosition>>(
    {},
  );
  const [activeFilter, setActiveFilter] = useState<"day" | "week" | "all">(
    "day",
  );
  const [showSmallChanges, setShowSmallChanges] = useState<boolean>(true);
  const [risingCount, setRisingCount] = useState<number>(0);
  const [fallingCount, setFallingCount] = useState<number>(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastUpdateTimeRef = useRef<number>(0);
  const [selectedBubble, setSelectedBubble] = useState<BubbleData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Performance optimization states
  const [motionEnabled, setMotionEnabled] = useState<boolean>(true);
  const [animationFrozen, setAnimationFrozen] = useState<boolean>(false);
  const animationStartTimeRef = useRef<number>(Date.now());
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Mock data if none provided
  const bubbleData =
    data.length > 0
      ? data
      : [
          {
            id: "1",
            name: "Light Sword",
            icon: "⚔️",
            percentChange: 8.57,
            value: 3.8,
            size: 120,
          },
          {
            id: "2",
            name: "Toy Bear",
            icon: "🧸",
            percentChange: 7.14,
            value: 22.5,
            size: 100,
          },
          {
            id: "3",
            name: "Top Hat",
            icon: "🎩",
            percentChange: 7.27,
            value: 11.8,
            size: 90,
          },
          {
            id: "4",
            name: "Hypno Lollipop",
            icon: "🍭",
            percentChange: 12.0,
            value: 2.24,
            size: 110,
          },
          {
            id: "5",
            name: "Crystal Ball",
            icon: "🔮",
            percentChange: 7.85,
            value: 8.79,
            size: 100,
          },
          {
            id: "6",
            name: "Witch Hat",
            icon: "🧙‍♀️",
            percentChange: 13.33,
            value: 3.4,
            size: 110,
          },
          {
            id: "7",
            name: "Holiday Drink",
            icon: "☕",
            percentChange: 14.29,
            value: 2.4,
            size: 130,
          },
          {
            id: "8",
            name: "Santa Hat",
            icon: "🎅",
            percentChange: -12.0,
            value: 2.2,
            size: 100,
          },
          {
            id: "9",
            name: "Love Candle",
            icon: "🕯️",
            percentChange: -11.56,
            value: 13,
            size: 110,
          },
          {
            id: "10",
            name: "Durov's Cap",
            icon: "🧢",
            percentChange: 15.0,
            value: 690,
            size: 150,
          },
          {
            id: "11",
            name: "Spy Agaric",
            icon: "🍄",
            percentChange: 7.7,
            value: 3.47,
            size: 90,
          },
          {
            id: "12",
            name: "Diamond Ring",
            icon: "💍",
            percentChange: 6.0,
            value: 17.49,
            size: 100,
          },
          {
            id: "13",
            name: "Cupid Charm",
            icon: "💘",
            percentChange: 9.09,
            value: 12,
            size: 110,
          },
          {
            id: "14",
            name: "Bunny Muffin",
            icon: "🧁",
            percentChange: -7.17,
            value: 4.4,
            size: 90,
          },
          {
            id: "15",
            name: "Voodoo Doll",
            icon: "🧸",
            percentChange: -7.73,
            value: 17.9,
            size: 100,
          },
        ];

  // Filter bubbles based on active filter and showSmallChanges
  const filteredBubbles = bubbleData.filter((bubble) => {
    if (!showSmallChanges && Math.abs(bubble.percentChange) < 5) {
      return false;
    }
    return true;
  });

  // Calculate rising and falling counts
  React.useEffect(() => {
    const rising = filteredBubbles.filter(
      (bubble) => bubble.percentChange > 0,
    ).length;
    const falling = filteredBubbles.filter(
      (bubble) => bubble.percentChange < 0,
    ).length;
    setRisingCount(rising);
    setFallingCount(falling);
  }, [filteredBubbles]);

  // Initialize positions
  useEffect(() => {
    if (!containerRef.current) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    setDimensions({ width, height });

    // Initialize positions randomly within container
    const newPositions: Record<string, BubblePosition> = {};
    filteredBubbles.forEach((bubble) => {
      const size = bubble.size;
      const padding = size / 2;

      newPositions[bubble.id] = {
        x: padding + Math.random() * (width - size),
        y: padding + Math.random() * (height - size),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      };
    });

    setPositions(newPositions);
  }, [filteredBubbles.length]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-freeze animation after 3 seconds for performance
  useEffect(() => {
    if (!motionEnabled || prefersReducedMotion) {
      setAnimationFrozen(true);
      return;
    }

    const timer = setTimeout(() => {
      if (!isDragging) {
        setAnimationFrozen(true);
      }
    }, 3000); // Freeze after 3 seconds

    return () => clearTimeout(timer);
  }, [motionEnabled, isDragging, prefersReducedMotion]);

  // Re-enable animation on user interaction
  const reactivateAnimation = useCallback(() => {
    if (motionEnabled && !prefersReducedMotion) {
      setAnimationFrozen(false);
      animationStartTimeRef.current = Date.now();
    }
  }, [motionEnabled, prefersReducedMotion]);

  // Enhanced physics simulation with performance optimizations
  useEffect(() => {
    if (Object.keys(positions).length === 0 || animationFrozen) return;

    const updatePositions = () => {
      const currentTime = performance.now();
      const deltaTime = Math.min(
        (currentTime - lastUpdateTimeRef.current) / 16.67,
        2,
      ); // Cap at 2x normal speed
      lastUpdateTimeRef.current = currentTime;

      setPositions((prevPositions) => {
        const newPositions = { ...prevPositions };

        // Update positions based on velocity for non-dragged bubbles (reduced motion intensity)
        filteredBubbles.forEach((bubble) => {
          if (isDragging === bubble.id) return;

          const pos = newPositions[bubble.id];
          if (!pos) return;

          const size = bubble.size;
          const radius = size / 2;

          // Reduced floating motion for better performance
          pos.vx += (Math.random() - 0.5) * 0.02 * deltaTime; // Reduced from 0.05
          pos.vy += (Math.random() - 0.5) * 0.02 * deltaTime; // Reduced from 0.05

          // Apply stronger damping for quicker settling
          pos.vx *= Math.pow(0.95, deltaTime); // Increased damping from 0.98
          pos.vy *= Math.pow(0.95, deltaTime); // Increased damping from 0.98

          // Update position
          pos.x += pos.vx * deltaTime;
          pos.y += pos.vy * deltaTime;

          // Boundary collision with elastic response
          if (pos.x < radius) {
            pos.x = radius;
            pos.vx = Math.abs(pos.vx) * 0.7;
          } else if (pos.x > dimensions.width - radius) {
            pos.x = dimensions.width - radius;
            pos.vx = -Math.abs(pos.vx) * 0.7;
          }

          if (pos.y < radius) {
            pos.y = radius;
            pos.vy = Math.abs(pos.vy) * 0.7;
          } else if (pos.y > dimensions.height - radius) {
            pos.y = dimensions.height - radius;
            pos.vy = -Math.abs(pos.vy) * 0.7;
          }
        });

        // Simplified collision detection for better performance
        const resolveCollisions = (iterations = 2) => {
          // Reduced from 3 iterations
          for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < filteredBubbles.length; i++) {
              const bubbleA = filteredBubbles[i];
              const posA = newPositions[bubbleA.id];
              if (!posA) continue;

              const radiusA = bubbleA.size / 2;

              for (let j = i + 1; j < filteredBubbles.length; j++) {
                const bubbleB = filteredBubbles[j];
                const posB = newPositions[bubbleB.id];
                if (!posB) continue;

                const radiusB = bubbleB.size / 2;
                const dx = posB.x - posA.x;
                const dy = posB.y - posA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = radiusA + radiusB + 2; // Small buffer

                if (distance < minDistance && distance > 0) {
                  const overlap = minDistance - distance;
                  const separationX = (dx / distance) * overlap * 0.5;
                  const separationY = (dy / distance) * overlap * 0.5;

                  // Position correction
                  if (isDragging !== bubbleA.id) {
                    posA.x -= separationX;
                    posA.y -= separationY;
                  }
                  if (isDragging !== bubbleB.id) {
                    posB.x += separationX;
                    posB.y += separationY;
                  }

                  // Velocity exchange with realistic physics
                  if (isDragging !== bubbleA.id && isDragging !== bubbleB.id) {
                    const relativeVx = posA.vx - posB.vx;
                    const relativeVy = posA.vy - posB.vy;
                    const normalVelocity =
                      (relativeVx * dx + relativeVy * dy) / distance;

                    if (normalVelocity > 0) {
                      const restitution = 0.6;
                      const impulse = (2 * normalVelocity * restitution) / 2;
                      const impulseX = (impulse * dx) / distance;
                      const impulseY = (impulse * dy) / distance;

                      posA.vx -= impulseX;
                      posA.vy -= impulseY;
                      posB.vx += impulseX;
                      posB.vy += impulseY;
                    }
                  }

                  // Special handling for dragged bubble interactions
                  if (isDragging === bubbleA.id) {
                    const pushForce = Math.min(overlap * 0.3, 5);
                    posB.vx += (dx / distance) * pushForce;
                    posB.vy += (dy / distance) * pushForce;
                  } else if (isDragging === bubbleB.id) {
                    const pushForce = Math.min(overlap * 0.3, 5);
                    posA.vx -= (dx / distance) * pushForce;
                    posA.vy -= (dy / distance) * pushForce;
                  }
                }
              }
            }
          }
        };

        resolveCollisions();
        return newPositions;
      });

      animationRef.current = requestAnimationFrame(updatePositions);
    };

    animationRef.current = requestAnimationFrame(updatePositions);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions, filteredBubbles, isDragging, animationFrozen]);

  // Enhanced drag handlers with improved performance
  const handleDragStart = useCallback(
    (id: string) => {
      reactivateAnimation(); // Reactivate animation on drag
      setIsDragging(id);
      const currentPos = positions[id];
      if (currentPos) {
        dragOffsetRef.current = { x: 0, y: 0 };
      }
    },
    [positions, reactivateAnimation],
  );

  const handleDrag = useCallback(
    (id: string, x: number, y: number) => {
      setDragPosition({ x, y });

      // Direct position update for immediate response - no requestAnimationFrame delay
      setPositions((prev) => {
        const newPositions = { ...prev };
        const pos = newPositions[id];
        if (!pos) return prev;

        // Direct position update for immediate response
        const bubble = filteredBubbles.find((b) => b.id === id);
        const radius = bubble ? bubble.size / 2 : 50;

        const targetX = Math.max(
          radius,
          Math.min(dimensions.width - radius, x),
        );
        const targetY = Math.max(
          radius,
          Math.min(dimensions.height - radius, y),
        );

        // Calculate velocity for momentum on release
        const dx = targetX - pos.x;
        const dy = targetY - pos.y;

        pos.vx = dx * 0.5; // Increased responsiveness
        pos.vy = dy * 0.5;
        pos.x = targetX;
        pos.y = targetY;

        return newPositions;
      });
    },
    [dimensions, filteredBubbles],
  );

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      // Apply spring physics on release
      setPositions((prev) => {
        const newPositions = { ...prev };
        const pos = newPositions[isDragging];
        if (pos) {
          // Add some release momentum
          pos.vx *= 1.5; // Increased momentum
          pos.vy *= 1.5;
        }
        return newPositions;
      });
    }
    setIsDragging(null);
    setDragPosition(null);
  }, [isDragging]);

  const handleBubbleTap = useCallback(
    (bubble: BubbleData) => {
      reactivateAnimation(); // Reactivate animation on tap
      // Immediate modal opening
      setSelectedBubble(bubble);
      setIsModalOpen(true);
    },
    [reactivateAnimation],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedBubble(null);
  }, []);

  return (
    <div className="flex flex-col w-full h-full bg-black">
      <div className="shrink-0">
        <FilterTabs
          onFilterChange={(filter) => setActiveFilter(filter)}
          risingCount={risingCount}
          fallingCount={fallingCount}
        />
      </div>

      <div
        ref={containerRef}
        className="bubble-container relative flex-1 overflow-hidden bg-black touch-none"
        style={{ touchAction: "none" }}
      >
        {filteredBubbles.map((bubble) => {
          const position = positions[bubble.id];
          if (!position) return null;

          return (
            <Bubble
              key={bubble.id}
              id={bubble.id}
              name={bubble.name}
              icon={bubble.icon}
              percentChange={bubble.percentChange}
              value={bubble.value}
              size={bubble.size}
              x={position.x}
              y={position.y}
              isDragging={isDragging === bubble.id}
              onDragStart={() => handleDragStart(bubble.id)}
              onDrag={(x, y) => handleDrag(bubble.id, x, y)}
              onDragEnd={handleDragEnd}
              onTap={() => handleBubbleTap(bubble)}
            />
          );
        })}

        {/* Enhanced center bubble with username - performance optimized */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: dimensions.width / 2 - 60,
            top: dimensions.height / 2 - 60,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0.6) 70%, rgba(0, 0, 0, 0.8) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            // Simplified box-shadow for better performance
            boxShadow: prefersReducedMotion
              ? "0 2px 10px rgba(255, 255, 255, 0.1)"
              : "0 0 20px rgba(255, 255, 255, 0.1), inset 0 0 15px rgba(255, 255, 255, 0.05)",
            zIndex: 0,
          }}
          animate={
            motionEnabled && !prefersReducedMotion && !animationFrozen
              ? {
                  scale: [1, 1.02, 1],
                  opacity: [0.8, 0.9, 0.8],
                }
              : {}
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span
            className="text-sm font-medium"
            style={{
              textShadow: prefersReducedMotion
                ? "none"
                : "0 0 6px rgba(0,0,0,0.6)",
            }}
          >
            @Gift_Graphs_bot
          </span>
        </motion.div>

        {/* Gift Detail Modal */}
        <GiftDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          bubble={selectedBubble}
        />
      </div>
    </div>
  );
};

export default BubbleSimulation;
