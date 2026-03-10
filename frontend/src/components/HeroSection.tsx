import { MapPin, Search, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-hero-gradient pt-8 pb-6 px-4">
      {/* Decorative elements */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-8 right-4 w-16 h-16 bg-caramel/20 rounded-full blur-xl"
      />
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-20 left-8 w-12 h-12 bg-latte/40 rounded-full blur-lg"
      />

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="p-2 bg-card rounded-xl shadow-soft">
              <Coffee className="h-6 w-6 text-caramel" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">
            CAFÉHOP
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Connecting local cafés with cafe hoppers
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative"
        >
          <div className="flex items-center gap-2 bg-card rounded-2xl p-2 shadow-card border border-border/50">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cafés, vibes, amenities..."
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <Button variant="caramel" size="sm" className="shrink-0 rounded-xl">
              <MapPin className="h-4 w-4 mr-1" />
              Near Me
            </Button>
          </div>
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-6 mt-5 text-center"
        >
          <div>
            <p className="font-display text-2xl font-bold text-foreground">150+</p>
            <p className="text-xs text-muted-foreground">Cafés</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="font-display text-2xl font-bold text-foreground">2.5k</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="font-display text-2xl font-bold text-caramel">$12k</p>
            <p className="text-xs text-muted-foreground">Saved</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
