import { motion } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import FilterPills from "@/components/FilterPills";
import CafeCard from "@/components/CafeCard";
import RewardsCard from "@/components/RewardsCard";
import ForYouCard from "@/components/ForYouCard";
import BottomNav from "@/components/BottomNav";
import { ChevronRight } from "lucide-react";

import cafe1 from "@/assets/cafe-1.jpg";
import cafe2 from "@/assets/cafe-2.jpg";
import cafe3 from "@/assets/cafe-3.jpg";
import latteArt from "@/assets/latte-art.jpg";

type IndexProps = {
  role: "customer" | "cafe";
};

const nearbyCafes = [
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
    isOpen: false,
  },
];

const forYouPosts = [
  {
    cafeName: "The Roastery",
    image: cafe1,
    caption: "Found the perfect study spot! Fast wifi, amazing lattes, and the coziest atmosphere ☕",
    likes: 234,
    comments: 18,
    postedBy: "Sarah M.",
    tags: ["studyspot", "latteart", "cozy"],
  },
  {
    cafeName: "Bean & Leaf",
    image: latteArt,
    caption: "This latte art though 😍 The baristas here are true artists!",
    likes: 456,
    comments: 32,
    postedBy: "Alex K.",
    tags: ["latteart", "barista", "coffeelover"],
  },
];

const Index = ({ role }: IndexProps) => {
  if (role === "cafe") {
    // Simple placeholder UI for cafe view
    return (
      <div className="min-h-screen bg-background pb-24 px-4">
        <h1 className="text-2xl font-bold text-center py-8">Cafe Dashboard</h1>
        <p className="text-center text-muted-foreground">
          Here you can see customer visits, points, and manage your café.
        </p>
        {/* You can add cafe-specific components here */}
      </div>
    );
  }

  // Default customer view
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <HeroSection />

      {/* Main Content */}
      <main className="px-4 max-w-lg mx-auto">
        {/* Filters */}
        <section className="py-4">
          <FilterPills />
        </section>

        {/* Rewards Card */}
        <section className="py-2">
          <RewardsCard points={1250} status="EXPLORER" nextReward={2000} />
        </section>

        {/* Nearby Cafés */}
        <section className="py-6">
          <div className="flex items-center justify-between mb-4">
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-display text-xl font-semibold"
            >
              Nearby Cafés
            </motion.h2>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-caramel flex items-center gap-1 hover:gap-2 transition-all"
            >
              See all <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>

          <div className="grid gap-4">
            {nearbyCafes.map((cafe, index) => (
              <CafeCard key={cafe.name} {...cafe} index={index} />
            ))}
          </div>
        </section>

        {/* For You Feed */}
        <section className="py-6">
          <div className="flex items-center justify-between mb-4">
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-xl font-semibold"
            >
              For You
            </motion.h2>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-caramel flex items-center gap-1 hover:gap-2 transition-all"
            >
              Explore <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>

          <div className="grid gap-5">
            {forYouPosts.map((post, index) => (
              <ForYouCard key={index} {...post} index={index} />
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
