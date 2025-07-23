import React, { useState } from "react";
import BubbleSimulation from "./BubbleSimulation";
import FilterTabs from "./FilterTabs";
import SimulationControls from "./SimulationControls";

interface HomeProps {
  className?: string;
}

const Home: React.FC<HomeProps> = ({ className = "" }) => {
  const [activeFilter, setActiveFilter] = useState<"day" | "week" | "all">(
    "day",
  );
  const [showSmallChanges, setShowSmallChanges] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("Day");

  const handleFilterChange = (filter: "day" | "week" | "all") => {
    setActiveFilter(filter);
    // Map the filter to the format expected by SimulationControls
    const filterMap = {
      day: "Day",
      week: "Week",
      all: "All time",
    };
    setSelectedFilter(filterMap[filter]);
  };

  const handleSimulationControlsFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    // Map back to the format expected by FilterTabs
    const filterMap: Record<string, "day" | "week" | "all"> = {
      Day: "day",
      Week: "week",
      "All time": "all",
    };
    if (filterMap[filter]) {
      setActiveFilter(filterMap[filter]);
    }
  };

  const handleShowSmallChangesToggle = (show: boolean) => {
    setShowSmallChanges(show);
  };

  return (
    <div className={`flex flex-col w-full h-screen bg-gray-900 ${className}`}>
      <SimulationControls
        onFilterChange={handleSimulationControlsFilterChange}
        onShowSmallChangesToggle={handleShowSmallChangesToggle}
        selectedFilter={selectedFilter}
        showSmallChanges={showSmallChanges}
      />
      <BubbleSimulation
        activeFilter={activeFilter}
        showSmallChanges={showSmallChanges}
      />
    </div>
  );
};

export default Home;
