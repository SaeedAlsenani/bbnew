import React, { useState } from "react";
import BubbleSimulation from "./BubbleSimulation";
import FilterTabs from "./FilterTabs";

interface HomeProps {
  className?: string;
}

const Home: React.FC<HomeProps> = ({ className = "" }) => {
  const [activeFilter, setActiveFilter] = useState<"day" | "week" | "all">(
    "day",
  );
  const [showSmallChanges, setShowSmallChanges] = useState<boolean>(true);

  const handleFilterChange = (filter: "day" | "week" | "all") => {
    setActiveFilter(filter);
  };

  const handleShowSmallChangesToggle = () => {
    setShowSmallChanges(!showSmallChanges);
  };

  return (
    <div className={`flex flex-col w-full h-screen bg-gray-900 ${className}`}>
      <BubbleSimulation />
    </div>
  );
};

export default Home;
