import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import RewardsCard from "@/components/RewardsCard";
import { Gift, ChevronRight, Coffee, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import cafe1 from "@/assets/cafe-1.jpg";
import latteArt from "@/assets/latte-art.jpg";

const rewardsList = [
  {
    id: 1,
    title: "Free Latte",
    cafe: "Any participating café",
    points: 500,
    image: latteArt,
    popular: true,
  },
  {
    id: 2,
    title: "20% Off Order",
    cafe: "The Roastery",
    points: 300,
    image: cafe1,
    popular: false,
  },
  {
    id: 3,
    title: "Free Pastry",
    cafe: "Bean & Leaf",
    points: 250,
    image: cafe1,
    popular: false,
  },
];

const Rewards = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-hero-gradient px-4 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-caramel/20 rounded-xl">
              <Gift className="h-6 w-6 text-caramel" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Rewards</h1>
              <p className="text-sm text-muted-foreground">Earn & redeem across cafés</p>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Content */}
      <main className="px-4 max-w-lg mx-auto -mt-2">
        {/* Status Card */}
        <section className="py-4">
          <RewardsCard points={1250} status="EXPLORER" nextReward={2000} />
        </section>

        {/* Quick Actions */}
        <section className="py-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Coffee, label: "Scan QR", desc: "Earn points" },
              { icon: Star, label: "History", desc: "Past visits" },
              { icon: Sparkles, label: "Bonus", desc: "2x today!" },
            ].map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center gap-2 p-4 bg-card rounded-2xl border border-border hover:bg-muted transition-colors"
              >
                <div className="p-2 bg-muted rounded-xl">
                  <action.icon className="h-5 w-5 text-caramel" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Available Rewards */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Available Rewards</h2>
            <button className="text-sm text-caramel flex items-center gap-1">
              See all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {rewardsList.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border"
              >
                <img
                  src={reward.image}
                  alt={reward.title}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{reward.title}</h3>
                    {reward.popular && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {reward.cafe}
                  </p>
                  <p className="text-sm font-semibold text-caramel">
                    {reward.points} pts
                  </p>
                </div>
                <Button variant="caramel" size="sm" className="shrink-0">
                  Redeem
                </Button>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Rewards;
