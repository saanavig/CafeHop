import { useState } from "react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { Clock, Coffee, Gift, X, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import cafe1 from "@/assets/cafe-1.jpg";
import cafe2 from "@/assets/cafe-2.jpg";
import cafe3 from "@/assets/cafe-3.jpg";
import latteArt from "@/assets/latte-art.jpg";

// CUSTOMER DATA (unchanged)
const customerVisitHistory = [
  { id: 1, cafe: "The Roastery", image: cafe1, date: "Today, 2:30 PM", pointsEarned: 50, spent: "$8.50" },
  { id: 2, cafe: "Bean & Leaf", image: cafe2, date: "Yesterday, 10:15 AM", pointsEarned: 45, spent: "$6.75" },
  { id: 3, cafe: "Brew Culture", image: cafe3, date: "Dec 18, 4:00 PM", pointsEarned: 60, spent: "$12.00" },
  { id: 4, cafe: "The Roastery", image: cafe1, date: "Dec 17, 9:00 AM", pointsEarned: 35, spent: "$5.25" },
  { id: 5, cafe: "Cafe Latte", image: cafe2, date: "Nov 25, 11:00 AM", pointsEarned: 40, spent: "$7.50" },
];

const customerRewardsHistory = [
  { id: 1, title: "Free Latte", cafe: "Any participating café", points: 500, image: latteArt },
  { id: 2, title: "20% Off Order", cafe: "The Roastery", points: 300, image: cafe1 },
  { id: 3, title: "Free Pastry", cafe: "Bean & Leaf", points: 250, image: cafe2 },
  { id: 4, title: "Cappuccino Discount", cafe: "Brew Culture", points: 200, image: cafe3 },
];

// CAFE DATA (new)
const cafeVisitHistory = [
  { id: 1, customer: "Alice", date: "Today, 2:30 PM", spent: "$8.50", pointsRedeemed: 50 },
  { id: 2, customer: "Bob", date: "Yesterday, 10:15 AM", spent: "$6.75", pointsRedeemed: 45 },
  { id: 3, customer: "Charlie", date: "Dec 18, 4:00 PM", spent: "$12.00", pointsRedeemed: 60 },
  { id: 4, customer: "David", date: "Dec 17, 9:00 AM", spent: "$5.25", pointsRedeemed: 35 },
  { id: 5, customer: "Eve", date: "Nov 25, 11:00 AM", spent: "$7.50", pointsRedeemed: 40 },
];

const cafeRewardsHistory = [
  { id: 1, reward: "Free Latte", customer: "Alice", points: 500 },
  { id: 2, reward: "20% Off Order", customer: "Bob", points: 300 },
  { id: 3, reward: "Free Pastry", customer: "Charlie", points: 250 },
  { id: 4, reward: "Cappuccino Discount", customer: "David", points: 200 },
];

type HistoryProps = {
  role: "customer" | "cafe";
};

const History = ({ role }: HistoryProps) => {
  const [showModal, setShowModal] = useState<null | "visits" | "rewards">(null);
  const [search, setSearch] = useState("");

  // Select data based on role
  const visitHistory = role === "cafe" ? cafeVisitHistory : customerVisitHistory;
  const rewardsHistory = role === "cafe" ? cafeRewardsHistory : customerRewardsHistory;

  const filteredRewards = rewardsHistory.filter((r) =>
    role === "cafe"
      ? (r as typeof cafeRewardsHistory[number]).customer.toLowerCase().includes(search.toLowerCase())
      : (r as typeof customerRewardsHistory[number]).title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVisits = visitHistory.filter((v) =>
    role === "cafe"
      ? (v as typeof cafeVisitHistory[number]).customer.toLowerCase().includes(search.toLowerCase())
      : (v as typeof customerVisitHistory[number]).cafe.toLowerCase().includes(search.toLowerCase())
  );


  // Optional stats for cafe vs customer
  const stats = role === "cafe"
    ? {
        totalCustomers: cafeVisitHistory.length,
        totalRewards: cafeRewardsHistory.length,
        totalRevenue: cafeVisitHistory.reduce((acc, v) => acc + parseFloat(v.spent.replace("$", "")), 0),
      }
    : {
        totalVisits: customerVisitHistory.length,
        cafesTried: new Set(customerVisitHistory.map(v => v.cafe)).size,
        totalPoints: customerVisitHistory.reduce((acc, v) => acc + v.pointsEarned, 0),
      };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-hero-gradient px-4 pt-8 pb-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-caramel/20 rounded-xl">
              <Clock className="h-6 w-6 text-caramel" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">History</h1>
              <p className="text-sm text-muted-foreground">
                {role === "cafe" ? "Customer activity at your café" : "Your café activity"}
              </p>
            </div>
          </div>
        </motion.div>
      </header>

      <main className="px-4 max-w-lg mx-auto">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-around py-6 border-b border-border">
          {role === "cafe" ? (
            <>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-foreground">{stats.totalCustomers}</p>
                <p className="text-xs text-muted-foreground">Total Customers</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-foreground">{stats.totalRewards}</p>
                <p className="text-xs text-muted-foreground">Rewards Redeemed</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-caramel">${stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-foreground">{stats.totalVisits}</p>
                <p className="text-xs text-muted-foreground">Total Visits</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-foreground">{stats.cafesTried}</p>
                <p className="text-xs text-muted-foreground">Cafés Tried</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-caramel">{stats.totalPoints}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
            </>
          )}
        </motion.div>

        {/* Visits / Customers Section */}
        <section className="py-4">
          <h2 className="font-display text-lg font-semibold mb-4">
            {role === "cafe" ? "Recent Customers" : "Recent Visits"}
          </h2>
          <div className="space-y-3">
            {visitHistory.slice(0, 3).map((visit, i) => (
              <motion.div key={visit.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border">
                <div className="flex-1 min-w-0">
                  {role === "cafe" ? (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-caramel" />
                        <h3 className="font-medium truncate">{visit.customer}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{visit.date}</p>
                      <p className="text-xs text-muted-foreground">Spent: {visit.spent}</p>
                      <Badge variant="secondary" className="shrink-0 bg-caramel/10 text-caramel border-0">
                        -{visit.pointsRedeemed} pts
                      </Badge>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Coffee className="h-3.5 w-3.5 text-caramel" />
                        <h3 className="font-medium truncate">{visit.cafe}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{visit.date}</p>
                      <p className="text-xs text-muted-foreground">Spent: {visit.spent}</p>
                      <Badge variant="secondary" className="shrink-0 bg-caramel/10 text-caramel border-0">
                        +{visit.pointsEarned} pts
                      </Badge>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          <Button className="w-full mt-4" onClick={() => setShowModal("visits")}>
            {role === "cafe" ? "See All Customers" : "See More Visits"}
          </Button>
        </section>

        {/* Rewards Section */}
        <section className="py-4">
          <h2 className="font-display text-lg font-semibold mb-4">
            {role === "cafe" ? "Rewards Redeemed" : "Recent Rewards"}
          </h2>
          <div className="space-y-3">
            {rewardsHistory.slice(0, 3).map((reward, i) => (
              <motion.div key={reward.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border">
                <div className="flex-1 min-w-0">
                  {role === "cafe" ? (
                    <>
                      <h3 className="font-medium truncate">{reward.reward}</h3>
                      <p className="text-xs text-muted-foreground truncate">{reward.customer}</p>
                      <p className="text-xs font-semibold text-caramel">{reward.points} pts</p>
                    </>
                  ) : (
                    <>
                      <img src={reward.image} alt={reward.title} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{reward.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{reward.cafe}</p>
                        <p className="text-xs font-semibold text-caramel">{reward.points} pts</p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          <Button className="w-full mt-4" onClick={() => setShowModal("rewards")}>
            {role === "cafe" ? "See All Rewards" : "See More Rewards"}
          </Button>
        </section>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(null)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition">
              <X className="h-4 w-4" />
            </button>

            <h2 className="font-semibold text-lg mb-4">
              {showModal === "visits" ? (role === "cafe" ? "All Customers" : "Older Visits") : (role === "cafe" ? "All Rewards Redeemed" : "Older Rewards")}
            </h2>

            {/* Search */}
            <input
              type="text"
              placeholder={showModal === "visits" ? (role === "cafe" ? "Search customers..." : "Search cafes...") : (role === "cafe" ? "Search customers..." : "Search rewards...")}
              className="w-full mb-4 p-2 border rounded"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* List */}
            <div className="space-y-3">
              {(showModal === "visits" ? filteredVisits : filteredRewards).map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border">
                  <div className="flex-1 min-w-0">
                    {showModal === "visits" ? (
                      role === "cafe" ? (
                        <>
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-caramel" />
                            <h3 className="font-medium truncate">{item.customer}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.date}</p>
                          <p className="text-xs text-muted-foreground">Spent: {item.spent}</p>
                          <Badge variant="secondary" className="shrink-0 bg-caramel/10 text-caramel border-0">
                            -{item.pointsRedeemed} pts
                          </Badge>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Coffee className="h-3.5 w-3.5 text-caramel" />
                            <h3 className="font-medium truncate">{item.cafe}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.date}</p>
                          <p className="text-xs text-muted-foreground">Spent: {item.spent}</p>
                          <Badge variant="secondary" className="shrink-0 bg-caramel/10 text-caramel border-0">
                            +{item.pointsEarned} pts
                          </Badge>
                        </>
                      )
                    ) : (
                      role === "cafe" ? (
                        <>
                          <h3 className="font-medium truncate">{item.reward}</h3>
                          <p className="text-xs text-muted-foreground truncate">{item.customer}</p>
                          <p className="text-xs font-semibold text-caramel">{item.points} pts</p>
                        </>
                      ) : (
                        <>
                          <img src={item.image} alt={item.title} className="w-14 h-14 rounded-xl object-cover" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{item.title}</h3>
                            <p className="text-xs text-muted-foreground truncate">{item.cafe}</p>
                            <p className="text-xs font-semibold text-caramel">{item.points} pts</p>
                          </div>
                        </>
                      )
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav role={role} />
    </div>
  );
};

export default History;
