import { useState } from "react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import RewardsCard from "@/components/RewardsCard";
import { Gift, Coffee, X } from "lucide-react";
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
  { id: 1, title: "Free Latte", cafe: "Any participating café", points: 500, image: latteArt, popular: true },
  { id: 2, title: "20% Off Order", cafe: "The Roastery", points: 300, image: cafe1, popular: false },
];

const Rewards = ({ role }: { role: "customer" | "cafe" }) => {
  const [showModal, setShowModal] = useState<null | "scan" | "redeem" | "levels" | "allRewards" | "addReward">(null);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>(initialRewards);
  const [redeemedRewards, setRedeemedRewards] = useState<Reward[]>([]);
  
  // Cafe add reward form
  const [newReward, setNewReward] = useState({
    title: "",
    points: 0,
    image: "",
    popular: false,
    cafe: role === "cafe" ? "My Café" : "Any participating café"
  });

  const handleRedeem = (reward: Reward) => {
    setRedeemedRewards([...redeemedRewards, reward]);
    setShowModal(null);
  };

  const handleAddReward = () => {
    const newId = availableRewards.length + 1;
    setAvailableRewards([...availableRewards, { id: newId, ...newReward }]);
    setShowModal(null);
    setNewReward({
      title: "",
      points: 0,
      image: "",
      popular: false,
      cafe: role === "cafe" ? "My Café" : "Any participating café"
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-hero-gradient px-4 pt-8 pb-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-caramel/20 rounded-xl">
              <Gift className="h-6 w-6 text-caramel" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Rewards</h1>
              <p className="text-sm text-muted-foreground">
                {role === "customer" ? "Earn & redeem across cafés" : "Manage your café rewards"}
              </p>
            </div>
          </div>
        </motion.div>
      </header>

      <main className="px-4 max-w-lg mx-auto -mt-2">
        {/* Rewards Status / Tier */}
        <section className="py-4">
          {role === "customer" ? (
            <RewardsCard
              points={1250}
              status="EXPLORER"
              nextReward={2000}
              description="Earn points and unlock perks"
            />
          ) : (
            <RewardsCard
              points={500}
              status="GOLD"
              nextReward={1000}
              description="Earn points and upgrade your café tier"
              themeColor="gold"
            />

          )}
        </section>

        {/* Available Rewards */}
        <section className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Available Rewards</h2>
            {role === "cafe" && (
              <button className="text-sm text-caramel" onClick={() => setShowModal("addReward")}>
                Add Reward
              </button>
            )}
          </div>

          <div className="space-y-3">
            {availableRewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border"
              >
                <img src={reward.image} alt={reward.title} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{reward.title}</h3>
                    {reward.popular && <Badge variant="secondary" className="text-xs shrink-0">Popular</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{reward.cafe}</p>
                  <p className="text-sm font-semibold text-caramel">{reward.points} pts</p>
                </div>
                {role === "customer" ? (
                  <Button variant="outline" size="sm" onClick={() => setShowModal("redeem")}>
                    Redeem
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => alert("Edit reward")}>
                    Edit
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(null)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted">
              <X className="h-4 w-4" />
            </button>

            {/* Customer scan / redeem */}
            {showModal === "scan" && role === "customer" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Scan QR</h2>
                <p>Scan the café QR code to earn points.</p>
                <Button className="w-full" onClick={() => setShowModal("redeem")}>Simulate Scan</Button>
              </div>
            )}

            {/* Cafe scanning customers */}
            {showModal === "scan" && role === "cafe" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Scan Customer QR</h2>
                <p>Scan your customer’s QR code to apply rewards or points.</p>
                <Button className="w-full" onClick={() => setShowModal(null)}>Simulate Scan</Button>
              </div>
            )}

            {/* Redeem modal */}
            {showModal === "redeem" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Reward Redeemed!</h2>
                <p>The reward has been successfully redeemed.</p>
                <Button className="w-full" onClick={() => setShowModal(null)}>Close</Button>
              </div>
            )}

            {/* Add new reward (cafes) */}
            {showModal === "addReward" && role === "cafe" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Add New Reward</h2>
                <input
                  type="text"
                  placeholder="Reward Title"
                  className="w-full p-2 border rounded"
                  value={newReward.title}
                  onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Points Required"
                  className="w-full p-2 border rounded"
                  value={newReward.points}
                  onChange={(e) => setNewReward({ ...newReward, points: Number(e.target.value) })}
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  className="w-full p-2 border rounded"
                  value={newReward.image}
                  onChange={(e) => setNewReward({ ...newReward, image: e.target.value })}
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newReward.popular}
                    onChange={(e) => setNewReward({ ...newReward, popular: e.target.checked })}
                  />
                  Popular
                </label>
                <Button className="w-full" onClick={handleAddReward}>Add Reward</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Rewards;
