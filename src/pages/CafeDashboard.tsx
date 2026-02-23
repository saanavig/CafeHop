// CafeDashboard.tsx
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import cafe1 from "@/assets/cafe-1.jpg";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const visitsByDay = [
  { day: "Mon", visits: 120 },
  { day: "Tue", visits: 180 },
  { day: "Wed", visits: 210 },
  { day: "Thu", visits: 260 },
  { day: "Fri", visits: 320 },
  { day: "Sat", visits: 410 },
  { day: "Sun", visits: 380 },
];

const engagementTrend = [
  { week: "W1", engagement: 12 },
  { week: "W2", engagement: 14 },
  { week: "W3", engagement: 16 },
  { week: "W4", engagement: 18 },
];

const CafeDashboard = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <header className="px-4 py-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold font-display"
        >
          CAFÉHOP
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-muted-foreground mt-2 text-sm"
        >
          Analytics Dashboard — see your café's performance
        </motion.p>
      </header>

      {/* Cafe Info Card */}
      <section className="px-4 max-w-lg mx-auto">
        <div className="bg-card rounded-3xl shadow border overflow-hidden">
          <img
            src={cafe1}
            className="w-full h-40 object-cover"
            alt="Cafe"
          />
          <div className="p-4">
            <h2 className="text-xl font-bold">Your Café</h2>
            <p className="text-sm text-muted-foreground">
              Cozy • Study-friendly • WiFi
            </p>
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section className="px-4 max-w-lg mx-auto mt-8 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-2xl border shadow-soft">
            <p className="text-sm text-muted-foreground">Weekly Visits</p>
            <p className="text-3xl font-bold">1,284</p>
            <p className="text-xs text-emerald-600 mt-1">▲ 12%</p>
          </div>

          <div className="bg-card p-4 rounded-2xl border shadow-soft">
            <p className="text-sm text-muted-foreground">Followers</p>
            <p className="text-3xl font-bold">642</p>
            <p className="text-xs text-emerald-600 mt-1">▲ +38</p>
          </div>
        </div>

        {/* Bar Chart — Visits */}
        <div className="bg-card rounded-2xl border shadow-soft p-4">
          <h4 className="font-medium mb-3">Visits by Day</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitsByDay}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar
                  dataKey="visits"
                  radius={[8, 8, 0, 0]}
                  className="fill-caramel"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart — Engagement */}
        <div className="bg-card rounded-2xl border shadow-soft p-4">
          <h4 className="font-medium mb-3">Engagement Trend</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementTrend}>
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  className="stroke-espresso"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Engagement has steadily increased over the past month ✨
          </p>
        </div>

        {/* Smart Insights */}
        <div className="bg-gradient-to-br from-caramel/20 to-latte/30 rounded-2xl p-4 border shadow-soft">
          <h4 className="font-medium mb-2">Smart Insights ✨</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>☕ Saturdays bring the highest foot traffic</li>
            <li>📸 Posts with latte art perform 32% better</li>
            <li>⏰ 4–7 PM is your peak engagement window</li>
          </ul>
        </div>
      </section>

      <BottomNav role="cafe" />
    </div>
  );
};

export default CafeDashboard;