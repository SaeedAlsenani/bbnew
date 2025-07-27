import React, { useState } from "react";
import BubbleSimulation from "./BubbleSimulation";

interface HomeProps {
  className?: string;
}

const Home: React.FC<HomeProps> = ({ className = "" }) => {
  return (
    <div className={`flex flex-col w-full h-screen bg-gray-900 ${className}`}>
      <BubbleSimulation />
    </div>
  );
};

export default Home;
