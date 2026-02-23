import { motion } from "framer-motion";
import { ArrowLeft, Bell, Coffee, Star, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

type NotificationsProps = {
  role: "customer" | "cafe";
};

const customerNotifications = [
  {
    id: 1,
    icon: Coffee,
    title: "Visit approved ☕",
    message: "Your receipt from BrewLab was verified. +120 points!",
    time: "2h ago",
  },
  {
    id: 2,
    icon: Star,
    title: "Reward unlocked 🎉",
    message: "You can now redeem a free latte at Oak Tree Café.",
    time: "Yesterday",
  },
  {
    id: 3,
    icon: Bell,
    title: "New café nearby",
    message: "Sunrise Roasters just joined CafeHop near you.",
    time: "2 days ago",
  },
];

const cafeVisits = [
  {
    id: 1,
    customer: "Sarah M.",
    points: 120,
    cafe: "BrewLab",
    time: "2h ago",
  },
  {
    id: 2,
    customer: "Alex K.",
    points: 90,
    cafe: "Java Junction",
    time: "3h ago",
  },
  {
    id: 3,
    customer: "Jamie L.",
    points: 150,
    cafe: "Bean Street",
    time: "Yesterday",
  },
];

const Notifications = ({ role }: NotificationsProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4">
      {/* Header */}
      <header className="flex items-center gap-3 py-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-muted transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold">
          {role === "customer" ? "Notifications" : "Customer Visits"}
        </h1>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto">
        {role === "customer" ? (
          customerNotifications.length === 0 ? (
            <p className="text-center text-muted-foreground mt-12">
              You’re all caught up 🎉
            </p>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pb-4">
              {customerNotifications.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 p-3 rounded-xl bg-muted flex items-center justify-center">
                    <notif.icon className="h-6 w-6 text-caramel" />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-foreground">{notif.title}</p>
                      <span className="text-xs text-muted-foreground">{notif.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : cafeVisits.length === 0 ? (
          <p className="text-center text-muted-foreground mt-12">
            No recent customer visits
          </p>
        ) : (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pb-4">
            {cafeVisits.map((visit, index) => (
              <motion.div
                key={visit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 p-3 rounded-xl bg-muted flex items-center justify-center">
                  <Store className="h-6 w-6 text-caramel" />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-foreground">{visit.customer} visited</p>
                    <span className="text-xs text-muted-foreground">{visit.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {visit.cafe} • <span className="font-semibold text-caramel">+{visit.points} pts</span>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;