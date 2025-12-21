import { useState } from "react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import FilterPills from "@/components/FilterPills";
import CafeCard from "@/components/CafeCard";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import cafe1 from "@/assets/cafe-1.jpg";
import cafe2 from "@/assets/cafe-2.jpg";
import cafe3 from "@/assets/cafe-3.jpg";

import { useNavigate } from "react-router-dom";


const allCafes = [
  { name: "The Roastery", image: cafe1, rating: 4.8, distance: "0.3 mi", amenities: ["wifi", "outlets", "coffee"], vibes: ["Cozy", "Quiet"], isOpen: true },
  { name: "Bean & Leaf", image: cafe2, rating: 4.6, distance: "0.5 mi", amenities: ["wifi", "coffee"], vibes: ["Bright", "Minimal"], isOpen: true },
  { name: "Brew Culture", image: cafe3, rating: 4.9, distance: "0.8 mi", amenities: ["wifi", "outlets", "coffee"], vibes: ["Industrial", "Hipster"], isOpen: true },
];

interface ExploreProps {
  role: "customer" | "cafe";
}


const Explore = ({ role }: ExploreProps) => {
  const navigate = useNavigate();
  const [selectedCafe, setSelectedCafe] = useState<typeof allCafes[0] | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "rewards" | "community">("info");
  
  const [mapExpanded, setMapExpanded] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);


  const filteredCafes = allCafes.filter(cafe =>
    cafe.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderCafeModalContent = () => {
    if (!selectedCafe) return null;

    switch (activeTab) {
      case "info":
        return (
          <div className="space-y-2">
            <p className="font-semibold text-lg">{selectedCafe.name}</p>
            <p>Rating: {selectedCafe.rating} ⭐</p>
            <p>Distance: {selectedCafe.distance}</p>
            <p>Amenities: {selectedCafe.amenities.join(", ")}</p>
            <p>Vibes: {selectedCafe.vibes.join(", ")}</p>
          </div>
        );
      case "rewards":
        return (
          <div className="space-y-2">
            <p className="font-semibold text-lg">Available Rewards</p>
            <ul className="list-disc pl-5 text-sm">
              <li>Free Latte - 500 pts</li>
              <li>20% Off Order - 300 pts</li>
              <li>Buy 1 Get 1 Free - 700 pts</li>
            </ul>
          </div>
        );
      case "community":
        return (
          <div className="space-y-2">
            <p className="font-semibold text-lg">Community Reviews & Q&A</p>
            <div className="text-sm">
              <p>⭐ User1: Loved the coffee and ambiance!</p>
              <p>⭐ User2: Great for study sessions.</p>
              <p>Q: Do they have charging outlets? A: Yes, all tables have outlets.</p>
            </div>
          </div>
        );
    }
  };

  const handleCafeClick = (cafe: typeof allCafes[0]) => {
    if (role === "customer") {
      setSelectedCafe(cafe);
      setActiveTab("info");
    } else {
      // If cafe, open mock modal with rewards / perks
      setSelectedCafe(cafe);
      setActiveTab("info");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 py-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
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
            <Button variant="caramel" size="icon" onClick={() => setFilterModalOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </header>

      {/* Map */}
      <section className="pb-6 px-4 max-w-lg mx-auto">
      <motion.div
        className={`relative w-full rounded-2xl bg-muted overflow-hidden flex flex-col items-center justify-center text-muted-foreground cursor-pointer`}
        style={{ height: mapExpanded ? "400px" : "256px" }} // expands when clicked
        layout
        onClick={() => setMapExpanded((prev) => !prev)}
      >

        {/* Map content */}
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          Map Demo
          {filteredCafes.map((cafe, idx) => (
            <button
              key={cafe.name}
              className="absolute bg-caramel w-4 h-4 rounded-full hover:scale-110 transition"
              style={{ top: `${10 + idx * 12}%`, left: `${20 + (idx * 15) % 80}%` }}
              onClick={() => handleCafeClick(cafe)}
            />
          ))}
        </div>
      </motion.div>

      </section>

      {/* Cafe List */}
      <section className="pb-6 px-4 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground mb-4">
          Showing <span className="font-medium text-foreground">{filteredCafes.length}</span> cafés near you
        </p>
        <div className="grid gap-4">
          {filteredCafes.map((cafe, index) => (
            <CafeCard key={cafe.name} {...cafe} index={index} onClick={() => handleCafeClick(cafe)} />
          ))}
        </div>
      </section>

    {/* Cafe Modal */}
    {selectedCafe && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] shadow-xl"
        >
          {/* Top Image */}
          <div className="relative h-48">
            <img
              src={selectedCafe.image}
              alt={selectedCafe.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setSelectedCafe(null)}
              className="absolute top-3 right-3 p-1 rounded-full bg-black/30 hover:bg-black/50 text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Name, Rating, About */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-display font-bold text-xl">{selectedCafe.name}</h2>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{selectedCafe.rating}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {selectedCafe.vibes.join(", ")} • {selectedCafe.distance}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedCafe.amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary" className="text-xs px-2 py-1">
                  {amenity}
                </Badge>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-4 mb-4">
              {["info", "rewards", "community"].map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "caramel" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activeTab === "info" && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><span className="font-medium">About:</span> Cozy café with great ambiance and free Wi-Fi.</p>
                  <p><span className="font-medium">Vibes:</span> {selectedCafe.vibes.join(", ")}</p>
                  <p><span className="font-medium">Distance:</span> {selectedCafe.distance}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCafe.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="text-xs px-2 py-1">{amenity}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "rewards" && (
                <div className="text-center space-y-4">
                  <p className="font-medium text-lg">Available Rewards</p>

                  <ul className="list-none space-y-2 text-sm">
                    <li className="flex justify-between px-4 py-2 bg-card rounded-xl shadow-sm">
                      <span>Free Latte</span>
                      <span className="font-semibold">500 pts</span>
                    </li>
                    <li className="flex justify-between px-4 py-2 bg-card rounded-xl shadow-sm">
                      <span>20% Off Order</span>
                      <span className="font-semibold">300 pts</span>
                    </li>
                    <li className="flex justify-between px-4 py-2 bg-card rounded-xl shadow-sm">
                      <span>Buy 1 Get 1 Free</span>
                      <span className="font-semibold">700 pts</span>
                    </li>
                  </ul>

                  <Button
                    variant="caramel"
                    className="w-full mt-2"
                    onClick={() => navigate("/rewards")}
                  >
                    View & Redeem Rewards
                  </Button>
                </div>
              )}


              {activeTab === "community" && (
                <div className="space-y-4 text-sm max-h-64 overflow-y-auto">
                  <p className="font-medium text-lg text-center">Community Reviews</p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-card rounded-xl p-2 shadow-sm">
                      <span>⭐ User1: Loved the coffee and ambiance!</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="outline">👍</Button>
                        <Button size="icon" variant="outline">👎</Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-card rounded-xl p-2 shadow-sm">
                      <span>⭐ User2: Great for study sessions.</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="outline">👍</Button>
                        <Button size="icon" variant="outline">👎</Button>
                      </div>
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 rounded-xl border border-border focus:outline-none focus:ring focus:ring-caramel/50"
                    />
                    <Button variant="caramel" size="sm">Post</Button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </motion.div>
      </div>
    )}
  
    {filterModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card w-11/12 max-w-md rounded-3xl p-6 shadow-2xl relative flex flex-col items-center"
        >
          {/* Close Button */}
          <button
            onClick={() => setFilterModalOpen(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Modal Title */}
          <h3 className="text-2xl font-bold mb-4">Filter Cafés</h3>

          {/* Filter Pills */}
          <div className="w-full mb-6">
            <FilterPills />
          </div>

          {/* Optional Extra Aura/Info */}
          <p className="text-sm text-muted-foreground text-center mb-4">
            Use filters to find cafés with Wi-Fi, outlets, quiet vibes, or great coffee.
          </p>

          <Button
            variant="caramel"
            className="w-full"
            onClick={() => setFilterModalOpen(false)}
          >
            Apply Filters
          </Button>
        </motion.div>
      </div>
    )}

      <BottomNav role={role} />
    </div>
  );
};

export default Explore;
