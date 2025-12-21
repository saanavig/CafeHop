import { useState } from "react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import ForYouCard from "@/components/ForYouCard";
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
  image: string | null; // image can be null
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
    caption: "Found the perfect study spot! Fast wifi, amazing lattes, and the coziest atmosphere ☕",
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
    caption: "Late-night vibes here are unmatched 🌙☕ Great for working on projects.",
    likes: 120,
    comments: 12,
    postedBy: "Nina P.",
    tags: ["latenight", "cozy", "studyspot"],
  },
];

const Index = ({ role }: IndexProps) => {
  const [posts, setPosts] = useState(initialForYouPosts);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");

  if (role === "cafe") {
    return (
      <div className="min-h-screen bg-background pb-24 px-4">
        <h1 className="text-2xl font-bold text-center py-8">Cafe Dashboard</h1>
        <p className="text-center text-muted-foreground">
          Your customer feed and posting options are hidden for café users.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
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

        {/* Search + Add Post */}
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

      {/* Feed */}
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

      {/* New Post Modal */}
      {newPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card w-11/12 max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
          >
            <h3 className="text-2xl font-bold text-center">New Post</h3>
            <textarea
              value={newPostCaption}
              onChange={(e) => setNewPostCaption(e.target.value)}
              placeholder="Write something..."
              className="border border-border rounded-xl p-2 focus:outline-none resize-none"
              rows={3}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setNewPostImage(e.target.files ? URL.createObjectURL(e.target.files[0]) : null)
              }
              className="mt-2"
            />
            <div className="flex justify-between mt-2 gap-2">
              <button
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition"
                onClick={() => {
                  setNewPostOpen(false);
                  setNewPostImage(null);
                  setNewPostCaption("");
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-caramel text-cream px-4 py-2 rounded-xl hover:shadow-md transition"
                onClick={() => {
                  setPosts([
                    {
                      cafeName: "Your Café",
                      image: newPostImage,
                      caption: newPostCaption,
                      likes: 0,
                      comments: 0,
                      postedBy: "You",
                      tags: [],
                    },
                    ...posts,
                  ]);
                  setNewPostCaption("");
                  setNewPostImage(null);
                  setNewPostOpen(false);
                }}
              >
                Post
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Comment Modal */}
      {commentPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card w-11/12 max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
          >
            <h3 className="text-xl font-bold">{commentPost.cafeName}</h3>
            <p className="text-sm text-muted-foreground">{commentPost.caption}</p>
            {commentPost.image && <img src={commentPost.image} alt="post" className="w-full mt-2 rounded-xl" />}
            
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="border border-border rounded-xl p-2 focus:outline-none resize-none mt-2"
              rows={2}
            />
            
            <div className="flex justify-between mt-2 gap-2">
              <button
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition"
                onClick={() => {
                  setCommentPost(null);
                  setNewComment("");
                }}
              >
                Close
              </button>
              <button
                className="flex-1 bg-caramel text-cream px-4 py-2 rounded-xl hover:shadow-md transition"
                onClick={() => {
                  alert(`Comment added: ${newComment}`);
                  setCommentPost(null);
                  setNewComment("");
                }}
              >
                Comment
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNav role={role} />
    </div>
  );
};

export default Index;
