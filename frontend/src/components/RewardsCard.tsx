import { Gift, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface RewardsCardProps {
  points: number;
  status: string;
  nextReward: number;
}

const RewardsCard = ({ points, status, nextReward }: RewardsCardProps) => {
  const progress = (points / nextReward) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-espresso p-5 shadow-elevated"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-caramel/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-caramel/10 rounded-full blur-2xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-caramel/20 rounded-xl">
              <Gift className="h-5 w-5 text-caramel" />
            </div>
            <div>
              <p className="text-primary-foreground/70 text-xs uppercase tracking-wider">
                My Status
              </p>
              <p className="text-primary-foreground font-display text-lg font-semibold">
                {status}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-caramel font-display text-2xl font-bold">{points}</p>
            <p className="text-primary-foreground/70 text-xs">Points</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-primary-foreground/70 mb-1.5">
            <span>Progress to next reward</span>
            <span>{nextReward - points} pts away</span>
          </div>
          <div className="h-2 bg-primary-foreground/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-caramel rounded-full"
            />
          </div>
        </div>

        {/* CTA */}
        <Button
          variant="warm"
          className="w-full justify-between group bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <span className="flex items-center gap-2">
            <Star className="h-4 w-4 text-caramel" />
            View Rewards
          </span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </motion.div>
  );
};

export default RewardsCard;
