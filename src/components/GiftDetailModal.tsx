import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, TrendingUp, Send, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BubbleData {
  id: string;
  name: string;
  icon: string;
  percentChange: number;
  value: number;
  size: number;
}

interface SupplyStats {
  initialSupply: number;
  currentSupply: number;
  upgradedSupply: number;
  amountBurnt: number;
  percentBurnt: number;
  percentUpgraded: number;
}

interface GiftDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bubble: BubbleData | null;
}

// Fear/Greed Meter Component
const FearGreedMeter: React.FC<{ value: number }> = ({ value }) => {
  const angle = (value / 100) * 180;
  const color =
    value > 75
      ? "#22c55e"
      : value > 50
        ? "#eab308"
        : value > 25
          ? "#f97316"
          : "#ef4444";

  return (
    <div className="relative w-32 h-20">
      <svg className="w-full h-full" viewBox="0 0 200 100">
        {/* Background arc */}
        <path
          d="M 20 80 A 80 80 0 0 1 180 80"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="8"
        />
        {/* Gradient arc */}
        <defs>
          <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        <path
          d="M 20 80 A 80 80 0 0 1 180 80"
          fill="none"
          stroke="url(#meterGradient)"
          strokeWidth="6"
          strokeDasharray={`${(value / 100) * 251.2} 251.2`}
          className="transition-all duration-1000 ease-out"
        />
        {/* Needle */}
        <g transform={`rotate(${angle - 90} 100 80)`}>
          <circle cx="100" cy="80" r="4" fill={color} />
          <line
            x1="100"
            y1="80"
            x2="100"
            y2="25"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-2xl font-bold text-white" style={{ color }}>
          {value}
        </div>
        <div className="text-xs text-gray-300 mt-1">FEAR/GREED</div>
      </div>
    </div>
  );
};

// Mini Chart Component
const MiniChart: React.FC<{ timeframe: string }> = ({ timeframe }) => {
  // Generate mock chart data based on timeframe
  const generateChartData = (points: number) => {
    const data = [];
    let value = 50 + Math.random() * 50;
    for (let i = 0; i < points; i++) {
      value += (Math.random() - 0.5) * 10;
      value = Math.max(20, Math.min(180, value));
      data.push(value);
    }
    return data;
  };

  const data = generateChartData(
    timeframe === "6Hours" ? 24 : timeframe === "Day" ? 48 : 100,
  );
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue;

  const pathData = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 300;
      const y = 80 - ((value - minValue) / range) * 60;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="w-full h-24 bg-gray-800 rounded-lg p-2">
      <svg className="w-full h-full" viewBox="0 0 300 80">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path d={`${pathData} L 300 80 L 0 80 Z`} fill="url(#chartGradient)" />
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          className="transition-all duration-500"
        />
      </svg>
    </div>
  );
};

const GiftDetailModal: React.FC<GiftDetailModalProps> = ({
  isOpen,
  onClose,
  bubble,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState("Day");
  const [fearGreedValue] = useState(Math.floor(Math.random() * 40) + 60); // Random value between 60-100

  if (!bubble) return null;

  // Generate mock supply stats
  const supplyStats: SupplyStats = {
    initialSupply: 15000,
    currentSupply: Math.floor(Math.random() * 10000) + 5000,
    upgradedSupply: Math.floor(Math.random() * 8000) + 2000,
    amountBurnt: Math.floor(Math.random() * 8000) + 1000,
    percentBurnt: Math.random() * 50 + 20,
    percentUpgraded: Math.random() * 30 + 50,
  };

  const isPositive = bubble.percentChange >= 0;
  const timeframes = ["6Hours", "Day", "Week", "Month", "All time"];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Header Section */}
            <div className="p-6 pb-3">
              <div className="flex justify-between items-start mb-4">
                {/* Fear/Greed Meter */}
                <div className="flex flex-col items-start">
                  <FearGreedMeter value={fearGreedValue} />
                  <div className="mt-2 px-3 py-1 bg-green-600 rounded-full">
                    <span className="text-xs text-white font-medium">
                      The market in general
                    </span>
                  </div>
                </div>

                {/* Value Display */}
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">V</span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {bubble.value}
                    </span>
                  </div>
                  <div
                    className={`text-lg font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}
                  >
                    {isPositive ? "+" : ""}
                    {bubble.percentChange.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Gift Display and Supply Statistics - Side by Side */}
              <div className="flex items-start gap-4 mb-4">
                {/* Compact Supply Statistics - Left Side */}
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-xs">Initial Supply:</span>
                    <span className="text-white text-xs font-medium">
                      {supplyStats.initialSupply.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-xs">Supply:</span>
                    <span className="text-white text-xs font-medium">
                      {supplyStats.currentSupply.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-xs">Upgraded:</span>
                    <span className="text-white text-xs font-medium">
                      {supplyStats.upgradedSupply.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span className="text-gray-300 text-xs">Burnt:</span>
                    </div>
                    <span className="text-white text-xs font-medium">
                      {supplyStats.amountBurnt.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-xs">% Burnt:</span>
                    <span className="text-orange-400 text-xs font-medium">
                      {supplyStats.percentBurnt.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-xs">% Upgraded:</span>
                    <span className="text-blue-400 text-xs font-medium">
                      {supplyStats.percentUpgraded.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Gift Display - Right Side */}
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      y: [0, -6, 0],
                      rotate: [0, 1, -1, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-5xl mb-2 filter drop-shadow-lg"
                  >
                    {bubble.icon}
                  </motion.div>
                  <h2 className="text-lg font-bold text-white text-center">
                    {bubble.name}
                  </h2>
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className="px-6 pb-6">
              {/* Timeframe Buttons */}
              <div className="flex gap-1 mb-4 overflow-x-auto">
                {timeframes.map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                      selectedTimeframe === timeframe
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600",
                    )}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <MiniChart timeframe={selectedTimeframe} />
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6">
              <div className="flex gap-3">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Send Gift
                </Button>
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GiftDetailModal;