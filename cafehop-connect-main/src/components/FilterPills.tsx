import { Wifi, Volume2, Plug, DollarSign, Clock, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

interface Filter {
  icon: React.ElementType;
  label: string;
  id: string;
}

const filters: Filter[] = [
  { icon: Wifi, label: "Free Wi-Fi", id: "wifi" },
  { icon: Volume2, label: "Quiet", id: "quiet" },
  { icon: Plug, label: "Outlets", id: "outlets" },
  { icon: DollarSign, label: "Budget", id: "budget" },
  { icon: Clock, label: "Open Now", id: "open" },
  { icon: Coffee, label: "Great Coffee", id: "coffee" },
];

const FilterPills = () => {
  const [activeFilters, setActiveFilters] = useState<string[]>(["open"]);

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-2 pb-2"
      >
        {filters.map((filter, index) => (
          <motion.div
            key={filter.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant={activeFilters.includes(filter.id) ? "caramel" : "pill"}
              size="sm"
              onClick={() => toggleFilter(filter.id)}
              className="shrink-0 gap-1.5"
            >
              <filter.icon className="h-3.5 w-3.5" />
              {filter.label}
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default FilterPills;
