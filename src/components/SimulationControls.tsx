import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

interface SimulationControlsProps {
  onFilterChange?: (filter: string) => void;
  onShowSmallChangesToggle?: (show: boolean) => void;
  selectedFilter?: string;
  showSmallChanges?: boolean;
}

const SimulationControls = ({
  onFilterChange = () => {},
  onShowSmallChangesToggle = () => {},
  selectedFilter = "Day",
  showSmallChanges = true,
}: SimulationControlsProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleFilterClick = (filter: string) => {
    onFilterChange(filter);
  };

  const handleCheckboxChange = (checked: boolean) => {
    onShowSmallChangesToggle(checked);
  };

  if (!isOpen) {
    return (
      <div className="fixed top-4 left-4 z-10">
        <Button
          variant="outline"
          className="rounded-full bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(true)}
        >
          Gifts
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/40 p-4">
      <div className="max-w-screen-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Gifts</h1>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant={selectedFilter === "Day" ? "default" : "outline"}
              className={`rounded-md ${selectedFilter === "Day" ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"}`}
              onClick={() => handleFilterClick("Day")}
            >
              Day
            </Button>
            <Button
              variant={selectedFilter === "Week" ? "default" : "outline"}
              className={`rounded-md ${selectedFilter === "Week" ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"}`}
              onClick={() => handleFilterClick("Week")}
            >
              Week
            </Button>
            <Button
              variant={selectedFilter === "All time" ? "default" : "outline"}
              className={`rounded-md ${selectedFilter === "All time" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              onClick={() => handleFilterClick("All time")}
            >
              All time
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-small-changes"
              checked={showSmallChanges}
              onCheckedChange={handleCheckboxChange}
            />
            <label
              htmlFor="show-small-changes"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show small changes
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationControls;
