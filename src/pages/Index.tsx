import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import cafe1 from "@/assets/cafe-1.jpg";
import cafe2 from "@/assets/cafe-2.jpg";
import cafe3 from "@/assets/cafe-3.jpg";
import latteArt from "@/assets/latte-art.jpg";

type IndexProps = {
  role: "customer" | "cafe";
};

interface Comment {
  user: string;
  text: string;
}

interface Post {
  cafeName: string;
  image: string | null;
  caption: string;
  likes: number;
  comments: number;
  postedBy: string;
  tags: string[];
  commentList?: Comment[];
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
    commentList: [
      { user: "User1", text: "Wow this latte art is amazing!" },
      { user: "User2", text: "I love this café too!" },
    ],
  },
  {
    cafeName: "Bean & Leaf",
    image: cafe2,
    caption: "This latte art though 😍 The baristas here are true artists!",
    likes: 456,
    comments: 32,
    postedBy: "Alex K.",
    tags: ["latteart", "barista", "coffeelover"],
    commentList: [
      { user: "User3", text: "Barista skills on point!" },
      { user: "User4", text: "Need to visit soon 😍" },
    ],
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
    commentList: [{ user: "User5", text: "Perfect for late-night study sessions!" }],
  },
];

/* TikTok-style post card with comments, like, and save */
const ForYouCard = ({ cafeName, image, caption, likes, postedBy, commentList = [] }: Post) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentsState, setCommentsState] = useState(commentList);

  const [likesState, setLikesState] = useState(likes);
  const [liked, setLiked] = useState(false);

  const [saved, setSaved] = useState(false);

  // Load like and save states from localStorage
  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem("likedPosts") || "{}");
    if (savedLikes[cafeName]) {
      setLiked(true);
      setLikesState(likes);
    }

    const savedPosts = JSON.parse(localStorage.getItem("savedPosts") || "{}");
    if (savedPosts[cafeName]) setSaved(true);
  }, [cafeName, likes]);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesState(likesState + (newLiked ? 1 : -1));

    const savedLikes = JSON.parse(localStorage.getItem("likedPosts") || "{}");
    savedLikes[cafeName] = newLiked;
    localStorage.setItem("likedPosts", JSON.stringify(savedLikes));
  };

  const handleSave = () => {
    const newSaved = !saved;
    setSaved(newSaved);

    const savedPosts = JSON.parse(localStorage.getItem("savedPosts") || "{}");
    savedPosts[cafeName] = newSaved;
    localStorage.setItem("savedPosts", JSON.stringify(savedPosts));
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    setCommentsState([...commentsState, { user: "You", text: newComment }]);
    setNewComment("");
  };

  return (
    <>
      <div className="relative w-full h-[70vh] sm:h-[75vh] bg-black text-white flex flex-col justify-end rounded-2xl overflow-hidden">
        <img
          src={image || latteArt}
          alt={cafeName}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end h-full">
          <div>
            <h2 className="font-bold text-lg">{cafeName}</h2>
            <p className="text-xs text-muted-foreground mb-2">Posted by {postedBy}</p>
            <p className="text-sm mt-1">{caption}</p>
          </div>

          <div className="flex justify-between mt-4 text-sm">
            <div className="flex items-center gap-4">
              <button onClick={handleLike} className="flex items-center gap-1">
                {liked ? "❤️" : "🤍"} {likesState} Likes
              </button>
              <button onClick={handleSave} className="flex items-center gap-1">
                {saved ? "💾 Saved" : "💾 Save"}
              </button>
            </div>
            <button onClick={() => setShowComments(true)}>💬 {commentsState.length} Comments</button>
          </div>
        </div>
      </div>

      {/* Bottom sheet comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex justify-center items-end bg-black/20 backdrop-blur-sm"
          >
            <div className="bg-card rounded-t-3xl max-h-[80vh] w-full max-w-lg flex flex-col overflow-hidden shadow-xl">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-border">
                <h3 className="font-bold text-lg">Comments</h3>
                <button onClick={() => setShowComments(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Comment list */}
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                {commentsState.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                ) : (
                  commentsState.map((c, i) => (
                    <p key={i}>
                      <span className="font-semibold">{c.user}: </span>
                      {c.text}
                    </p>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2 p-4 border-t border-border">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 rounded-xl border border-border focus:outline-none focus:ring focus:ring-caramel/50"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                />
                <Button variant="caramel" size="sm" onClick={handlePostComment}>
                  Post
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
            <div key={index} className="h-[75vh] sm:h-[80vh] snap-start">
              <ForYouCard {...post} />
            </div>
          ))}
      </main>

      <BottomNav role={role} />
    </div>
  );
};

export default Index;