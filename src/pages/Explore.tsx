import { useState } from "react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import FilterPills from "@/components/FilterPills";
import CafeCard from "@/components/CafeCard";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import cafe1 from "@/assets/cafe-1.jpg";
import cafe2 from "@/assets/cafe-2.jpg";
import cafe3 from "@/assets/cafe-3.jpg";

const allCafes = [
  {
    name: "The Roastery",
    image: cafe1,
    rating: 4.8,
    distance: "0.3 mi",
    amenities: ["wifi", "outlets", "coffee"],
    vibes: ["Cozy", "Quiet", "Study-friendly"],
    isOpen: true,
  },
  {
    name: "Bean & Leaf",
    image: cafe2,
    rating: 4.6,
    distance: "0.5 mi",
    amenities: ["wifi", "coffee"],
    vibes: ["Bright", "Minimal", "Instagram-worthy"],
    isOpen: true,
  },
  {
    name: "Brew Culture",
    image: cafe3,
    rating: 4.9,
    distance: "0.8 mi",
    amenities: ["wifi", "outlets", "coffee"],
    vibes: ["Industrial", "Hipster", "Late-night"],
    isOpen: true,
  },
  {
    name: "Morning Brew",
    image: cafe1,
    rating: 4.5,
    distance: "1.2 mi",
    amenities: ["wifi", "outlets"],
    vibes: ["Early bird", "Quiet", "Workspace"],
    isOpen: true,
  },
  {
    name: "The Coffee Lab",
    image: cafe3,
    rating: 4.7,
    distance: "1.5 mi",
    amenities: ["wifi", "coffee"],
    vibes: ["Experimental", "Artsy", "Unique"],
    isOpen: false,
  },
];

const Explore = () => {
  const [selectedCafe, setSelectedCafe] = useState<typeof allCafes[0] | null>(null);
  const [search, setSearch] = useState("");

  // Filter cafes based on search
  const filteredCafes = allCafes.filter((cafe) =>
    cafe.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <div className="flex items-center gap-2 mb-3">
            <h1 className="font-display text-2xl font-bold flex-1">Explore</h1>
            <Button variant="warm" size="icon" className="rounded-xl">
              <MapPin className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-card rounded-xl px-3 py-2.5 border border-border">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cafés..."
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="caramel" size="icon" className="rounded-xl shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </header>

      {/* Content */}
      <main className="px-4 max-w-lg mx-auto">
        {/* Filters */}
        <section className="py-4">
          <FilterPills />
        </section>

        {/* Map */}
        <section className="pb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full h-64 rounded-2xl bg-muted overflow-hidden flex items-center justify-center text-muted-foreground"
          >
            Map Demo
            {/* Mock markers */}
            {filteredCafes.map((cafe, idx) => (
              <button
                key={cafe.name}
                className="absolute bg-caramel w-4 h-4 rounded-full hover:scale-110 transition"
                style={{ top: `${10 + idx * 12}%`, left: `${20 + (idx * 15) % 80}%` }}
                onClick={() => setSelectedCafe(cafe)}
              />
            ))}
          </motion.div>
        </section>

        {/* Results */}
        <section className="pb-6">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground mb-4"
          >
            Showing <span className="font-medium text-foreground">{filteredCafes.length}</span> cafés near you
          </motion.p>

          <div className="grid gap-4">
            {filteredCafes.map((cafe, index) => (
              <CafeCard
                key={cafe.name}
                {...cafe}
                index={index}
                onClick={() => setSelectedCafe(cafe)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Cafe Modal */}
      {selectedCafe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCafe(null)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>
            <CafeCard {...selectedCafe} />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Explore;
