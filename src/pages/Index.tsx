import { useState } from "react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import ForYouCard from "@/components/ForYouCard";
import { Search } from "lucide-react";

import cafe1 from "@/assets/cafe-1.jpg";
import cafe2 from "@/assets/cafe-2.jpg";
import cafe3 from "@/assets/cafe-3.jpg";
import latteArt from "@/assets/latte-art.jpg";

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


type IndexProps = {
  role: "customer" | "cafe";
};

interface Post {
  cafeName: string;
  image: string | null;
  caption: string;
  likes: number;
  comments: number;
  postedBy: string;
  tags: string[];
}

const initialForYouPosts: Post[] = [
  {
    cafeName: "The Roastery",
    image: cafe1,
    caption:
      "Found the perfect study spot! Fast wifi, amazing lattes, and the coziest atmosphere ☕",
    likes: 234,
    comments: 18,
    postedBy: "Sarah M.",
    tags: ["studyspot", "latteart", "cozy"],
  },
  {
    cafeName: "Bean & Leaf",
    image: cafe2,
    caption: "This latte art though 😍 The baristas here are true artists!",
    likes: 456,
    comments: 32,
    postedBy: "Alex K.",
    tags: ["latteart", "barista", "coffeelover"],
  },
  {
    cafeName: "Brew Culture",
    image: cafe3,
    caption:
      "Late-night vibes here are unmatched 🌙☕ Great for working on projects.",
    likes: 120,
    comments: 12,
    postedBy: "Nina P.",
    tags: ["latenight", "cozy", "studyspot"],
  },
];

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

/* =========================
   CAFE DASHBOARD COMPONENT
========================= */
const CafeDashboard = ({ role }: { role: "cafe" }) => {
  const [about, setAbout] = useState(
    "We’re a cozy neighborhood café with fast WiFi, specialty drinks, and plenty of seating."
  );
  const [editingAbout, setEditingAbout] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero (same as customer) */}
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
          Connecting local cafés with cafe hoppers
        </motion.p>
      </header>

      {/* Cafe Card */}
      <section className="px-4 max-w-lg mx-auto">
        <div className="bg-card rounded-3xl shadow border overflow-hidden">
          <img
            src={cafe1}
            className="w-full h-40 object-cover"
            alt="Cafe"
          />
          <div className="p-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Your Café</h2>
              <p className="text-sm text-muted-foreground">
                Cozy • Study-friendly • WiFi
              </p>
            </div>
            <button className="text-sm text-caramel">Edit Profile</button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="px-4 max-w-lg mx-auto mt-6">
        <div className="bg-card rounded-2xl p-4 shadow border">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">About</h3>
            <button
              className="text-sm text-caramel"
              onClick={() => setEditingAbout(!editingAbout)}
            >
              {editingAbout ? "Save" : "Edit"}
            </button>
          </div>

          {editingAbout ? (
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={3}
              className="w-full border rounded-xl p-2 text-sm"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{about}</p>
          )}
        </div>
      </section>

      {/* Analytics */}
      <section className="px-4 max-w-lg mx-auto mt-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold">Cafe Analytics</h3>
          <span className="text-xs text-muted-foreground">Last 7 days</span>
        </div>

        {/* Stat cards */}
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


            <BottomNav role={role} />
          </div>
        );
      };

/* =========================
        MAIN INDEX
========================= */
const Index = ({ role }: IndexProps) => {
  const [posts, setPosts] = useState(initialForYouPosts);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");

  if (role === "cafe") {
    return <CafeDashboard role={role} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* CUSTOMER UI — UNTOUCHED */}
      {/* Header */}
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
          Connecting local cafés with cafe hoppers
        </motion.p>

        <div className="mt-6 flex justify-center gap-2 max-w-lg mx-auto">
          <div className="flex-1 flex items-center gap-2 bg-card rounded-2xl p-2 shadow-card border border-border/50">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search posts..."
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button
            onClick={() => setNewPostOpen(true)}
            className="bg-caramel text-cream px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition"
          >
            + Add Post
          </button>
        </div>
      </header>

      <main className="px-4 max-w-lg mx-auto space-y-5">
        {posts.map((post, index) => (
          <ForYouCard
            key={index}
            {...post}
            index={index}
            onClick={() => setCommentPost(post)}
          />
        ))}
      </main>

      <BottomNav role={role} />
    </div>
  );
};

export default Index;
