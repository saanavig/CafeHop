import { Gift, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface RewardsCardProps {
  points: number;
  status: string;
  nextReward: number;
  description?: string; 
  themeColor?: "caramel" | "gold"; 
  role: "customer" | "cafe";
  onScan?: () => void; // callback for Scan QR / View Rewards
}

const RewardsCard = ({
  points,
  status,
  nextReward,
  description,
  themeColor = "caramel",
  role,
  onScan,
}: RewardsCardProps) => {
  const progress = (points / nextReward) * 100;
  const isGold = themeColor === "gold";

  const gradient = isGold
    ? "bg-gradient-to-br from-yellow-100 to-yellow-300"
    : "bg-gradient-to-br from-primary to-espresso";
  const iconBg = isGold ? "bg-yellow-100/30" : "bg-caramel/20";
  const iconColor = isGold ? "text-yellow-400" : "text-caramel";
  const textColor = isGold ? "text-black" : "text-white";
  const textColorSecondary = isGold ? "text-black/70" : "text-white/70"; 
  const progressColor = isGold ? "bg-yellow-400" : "bg-caramel";
  const decoTopRight = isGold ? "bg-yellow-100/20" : "bg-caramel/20";
  const decoBottomLeft = isGold ? "bg-yellow-100/15" : "bg-caramel/10";
  const ctaBg = isGold
    ? "bg-yellow-100/20 border-yellow-200/40 text-black hover:bg-yellow-100/30"
    : "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20";
  const ctaIcon = isGold ? "text-yellow-400" : "text-caramel";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl p-5 shadow-elevated ${gradient}`}
    >
      {/* Decorative elements */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl ${decoTopRight}`} />
      <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl ${decoBottomLeft}`} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${iconBg}`}>
              <Gift className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <p className={`${textColorSecondary} text-xs uppercase tracking-wider`}>My Status</p>
              <p className={`font-display text-lg font-semibold ${textColor}`}>{status}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-display text-2xl font-bold ${textColor}`}>{points}</p>
            <p className={`${textColorSecondary} text-xs`}>Points</p>
          </div>
        </div>

        {/* Optional description */}
        {description && <p className={`${textColor} text-sm mb-4`}>{description}</p>}

        {/* Progress */}
        <div className="mb-4">
          <div className={`flex justify-between text-xs mb-1.5 ${textColorSecondary}`}>
            <span>Progress to next reward</span>
            <span>{nextReward - points} pts away</span>
          </div>
          <div className={`h-2 bg-black/10 rounded-full overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full rounded-full ${progressColor}`}
            />
          </div>
        </div>

        {/* CTA */}
        {role === "customer" && (
          <Button
            variant="warm"
            className={`w-full justify-between group ${ctaBg}`}
            onClick={onScan} // call parent callback
          >
            <span className="flex items-center gap-2">
              <Star className={`h-4 w-4 ${ctaIcon}`} />
              Scan QR
            </span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}

      </div>
    </motion.div>
  );
};

export default RewardsCard;
