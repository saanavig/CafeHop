import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { Search } from "lucide-react";

import cafe1 from "@/assets/cafe-1.jpg";
import cafe2 from "@/assets/cafe-2.jpg";
import cafe3 from "@/assets/cafe-3.jpg";
import latteArt from "@/assets/latte-art.jpg";

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

/* Minimal full-screen TikTok-style card */
const ForYouCard = ({ cafeName, image, caption, likes, comments }: Post) => {
  return (
    <div className="relative w-full h-full bg-black text-white flex flex-col justify-end rounded-2xl overflow-hidden">
      <img
        src={image || latteArt}
        alt={cafeName}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
        <h2 className="font-bold text-lg">{cafeName}</h2>
        <p className="text-sm mt-2">{caption}</p>
        <div className="flex gap-4 mt-3 text-xs">
          <span>❤️ {likes}</span>
          <span>💬 {comments}</span>
        </div>
      </div>
    </div>
  );
};

const Index = ({ role }: IndexProps) => {
  const [posts, setPosts] = useState<Post[]>(initialForYouPosts);
  const [search, setSearch] = useState("");

  // Infinite scroll simulation
  const loadMorePosts = () => {
    setPosts((prev) => [...prev, ...initialForYouPosts]);
  };

  useEffect(() => {
    const handleScroll = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      if (bottom) loadMorePosts();
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (role === "cafe") {
    // Keep your existing CafeDashboard
    return <div>/* Your CafeDashboard Component */</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Minimal header with search */}
      <header className="px-4 py-4 max-w-lg mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold font-display text-center"
        >
          CAFÉHOP
        </motion.h1>
        <div className="mt-4 flex items-center gap-2 bg-card rounded-2xl p-2 shadow-card border border-border/50">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </header>

      {/* TikTok-style feed */}
      <main className="h-screen max-w-lg mx-auto overflow-y-scroll snap-y snap-mandatory space-y-6">
        {posts
          .filter((post) =>
            post.caption.toLowerCase().includes(search.toLowerCase())
          )
          .map((post, index) => (
            <div key={index} className="h-screen snap-start">
              <ForYouCard {...post} />
            </div>
          ))}
      </main>

      <BottomNav role={role} />
    </div>
  );
};

export default Index;