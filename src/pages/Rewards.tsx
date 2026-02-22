import { useState } from "react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import RewardsCard from "@/components/RewardsCard";
import { Gift, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import cafe1 from "@/assets/cafe-1.jpg";
import latteArt from "@/assets/latte-art.jpg";

interface Reward {
  id: number;
  title: string;
  cafe: string;
  points: number;
  image: string;
  popular: boolean;
}

const initialRewards: Reward[] = [
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
];

const Rewards = ({ role }: { role: "customer" | "cafe" }) => {
  const [points, setPoints] = useState(1250);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showAddReward, setShowAddReward] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const [availableRewards, setAvailableRewards] =
    useState<Reward[]>(initialRewards);

  const [newReward, setNewReward] = useState({
    title: "",
    points: 0,
    popular: false,
  });

  const handleRedeem = () => {
    if (!selectedReward) return;
    if (points < selectedReward.points) return;

    setPoints((prev) => prev - selectedReward.points);
    setSelectedReward(null);
  };

  const handleAddReward = () => {
    if (!newReward.title || newReward.points <= 0) return;

    const newItem: Reward = {
      id: Date.now(),
      title: newReward.title,
      cafe: "My Café",
      points: newReward.points,
      image: cafe1,
      popular: newReward.popular,
    };

    setAvailableRewards((prev) => [...prev, newItem]);
    setShowAddReward(false);
    setNewReward({ title: "", points: 0, popular: false });
  };

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
              <p className="text-sm text-muted-foreground">
                {role === "customer"
                  ? "Earn & redeem across cafés"
                  : "Manage your café rewards"}
              </p>
            </div>
          </div>
        </motion.div>
      </header>

      <main className="px-4 max-w-lg mx-auto -mt-2">
        {/* Rewards Card */}
        <section className="py-4">
          <RewardsCard
            points={role === "customer" ? points : 500}
            status={role === "customer" ? "EXPLORER" : "GOLD"}
            nextReward={2000}
            description="Earn points and unlock perks"
            role={role}
            onScan={() => setShowScan(true)}
          />
        </section>

        {/* Rewards List */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">
              Available Rewards
            </h2>

            {role === "cafe" && (
              <button
                className="text-sm text-caramel font-medium"
                onClick={() => setShowAddReward(true)}
              >
                + Add Reward
              </button>
            )}
          </div>

          <div className="space-y-3">
            {availableRewards.map((reward, index) => {
              const canAfford = points >= reward.points;

              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border"
                >
                  <img
                    src={reward.image}
                    alt={reward.title}
                    className="w-16 h-16 rounded-xl object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">
                        {reward.title}
                      </h3>
                      {reward.popular && (
                        <Badge
                          variant="secondary"
                          className="text-xs shrink-0"
                        >
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

                  {role === "customer" ? (
                    <Button
                      size="sm"
                      disabled={!canAfford}
                      variant={canAfford ? "default" : "outline"}
                      onClick={() => setSelectedReward(reward)}
                    >
                      Redeem
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      {/* QR Scan Modal */}
      {showScan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 relative text-center">
            <button
              onClick={() => {
                setShowScan(false);
                setScanSuccess(false);
              }}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>

            {!scanSuccess ? (
              <>
                <h2 className="font-semibold text-lg mb-4">
                  {role === "customer"
                    ? "Scan Café QR Code"
                    : "Scan Customer QR Code"}
                </h2>

                <div className="h-40 w-40 mx-auto mb-4 bg-muted rounded-xl flex items-center justify-center">
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-4 w-4 ${
                          Math.random() > 0.5 ? "bg-black" : "bg-white"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    if (role === "customer") {
                      setPoints((prev) => prev + 150);
                    }
                    setScanSuccess(true);
                  }}
                >
                  Simulate Scan
                </Button>
              </>
            ) : (
              <>
                <h2 className="font-semibold text-lg mb-2">
                  {role === "customer"
                    ? "+150 Points Earned 🎉"
                    : "Customer Scanned Successfully"}
                </h2>

                <p className="text-sm text-muted-foreground mb-4">
                  {role === "customer"
                    ? "Your visit has been recorded."
                    : "Points have been applied to the customer."}
                </p>

                <Button
                  className="w-full"
                  onClick={() => {
                    setShowScan(false);
                    setScanSuccess(false);
                  }}
                >
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Redeem Modal */}
      {selectedReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 relative">
            <button
              onClick={() => setSelectedReward(null)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="font-semibold text-lg mb-2">
              Redeem {selectedReward.title}?
            </h2>

            <p className="text-sm text-muted-foreground mb-4">
              This will cost {selectedReward.points} points.
            </p>

            <Button className="w-full" onClick={handleRedeem}>
              Confirm Redemption
            </Button>
          </div>
        </div>
      )}

      {/* Add Reward Modal */}
      {showAddReward && role === "cafe" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 relative">
            <button
              onClick={() => setShowAddReward(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="font-semibold text-lg mb-4">
              Add New Reward
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Reward Title"
                className="w-full p-2 border rounded-lg"
                value={newReward.title}
                onChange={(e) =>
                  setNewReward({ ...newReward, title: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Points Required"
                className="w-full p-2 border rounded-lg"
                value={newReward.points}
                onChange={(e) =>
                  setNewReward({
                    ...newReward,
                    points: Number(e.target.value),
                  })
                }
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newReward.popular}
                  onChange={(e) =>
                    setNewReward({
                      ...newReward,
                      popular: e.target.checked,
                    })
                  }
                />
                Mark as Popular
              </label>

              <Button className="w-full" onClick={handleAddReward}>
                Add Reward
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role={role} />
    </div>
  );
};

export default Rewards;