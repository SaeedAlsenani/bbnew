import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface FilterTabsProps {
  onFilterChange?: (filter: "day" | "week" | "all") => void;
  risingCount?: number;
  fallingCount?: number;
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  onFilterChange = () => {},
  risingCount = 0,
  fallingCount = 0,
}) => {
  const [activeFilter, setActiveFilter] = useState<"day" | "week" | "all">(
    "day",
  );

  const handleFilterChange = (filter: "day" | "week" | "all") => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="bg-gray-900 text-white px-3 py-2 w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-1">
          <h1 className="text-lg font-bold mr-3">Gifts</h1>
          <Button
            variant={activeFilter === "day" ? "default" : "outline"}
            size="sm"
            className={`${activeFilter === "day" ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-600"} text-white text-xs px-2 py-1 h-7`}
            onClick={() => handleFilterChange("day")}
          >
            Day
          </Button>
          <Button
            variant={activeFilter === "week" ? "default" : "outline"}
            size="sm"
            className={`${activeFilter === "week" ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-600"} text-white text-xs px-2 py-1 h-7`}
            onClick={() => handleFilterChange("week")}
          >
            Week
          </Button>
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            className={`${activeFilter === "all" ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-600"} text-white text-xs px-2 py-1 h-7`}
            onClick={() => handleFilterChange("all")}
          >
            All time
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <ChevronUp className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-500">
              {risingCount}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <ChevronDown className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-red-500">
              {fallingCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterTabs;
