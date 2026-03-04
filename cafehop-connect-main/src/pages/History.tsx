import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { Clock, Coffee, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import cafe1 from "@/assets/cafe-1.jpg";
import cafe2 from "@/assets/cafe-2.jpg";
import cafe3 from "@/assets/cafe-3.jpg";

const visitHistory = [
  {
    id: 1,
    cafe: "The Roastery",
    image: cafe1,
    date: "Today, 2:30 PM",
    pointsEarned: 50,
    spent: "$8.50",
  },
  {
    id: 2,
    cafe: "Bean & Leaf",
    image: cafe2,
    date: "Yesterday, 10:15 AM",
    pointsEarned: 45,
    spent: "$6.75",
  },
  {
    id: 3,
    cafe: "Brew Culture",
    image: cafe3,
    date: "Dec 18, 4:00 PM",
    pointsEarned: 60,
    spent: "$12.00",
  },
  {
    id: 4,
    cafe: "The Roastery",
    image: cafe1,
    date: "Dec 17, 9:00 AM",
    pointsEarned: 35,
    spent: "$5.25",
  },
];

const History = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-hero-gradient px-4 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-caramel/20 rounded-xl">
              <Clock className="h-6 w-6 text-caramel" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">History</h1>
              <p className="text-sm text-muted-foreground">Your café visits</p>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Stats Summary */}
      <main className="px-4 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-around py-6 border-b border-border"
        >
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-foreground">24</p>
            <p className="text-xs text-muted-foreground">Total Visits</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-foreground">8</p>
            <p className="text-xs text-muted-foreground">Cafés Tried</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-caramel">1,250</p>
            <p className="text-xs text-muted-foreground">Total Points</p>
          </div>
        </motion.div>

        {/* Visit List */}
        <section className="py-4">
          <h2 className="font-display text-lg font-semibold mb-4">Recent Visits</h2>
          
          <div className="space-y-3">
            {visitHistory.map((visit, index) => (
              <motion.div
                key={visit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border"
              >
                <img
                  src={visit.image}
                  alt={visit.cafe}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-3.5 w-3.5 text-caramel" />
                    <h3 className="font-medium truncate">{visit.cafe}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{visit.date}</p>
                  <p className="text-xs text-muted-foreground">Spent: {visit.spent}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 bg-caramel/10 text-caramel border-0">
                  +{visit.pointsEarned} pts
                </Badge>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default History;
