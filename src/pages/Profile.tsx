import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Grid3X3,
  Star,
  Bookmark,
  Store,
  User,
  Coffee,
  Flame,
  Heart,
  MessageCircle,
  Share,
} from "lucide-react";

type ProfileProps = {
  role: "customer" | "cafe";
};

type Comment = {
  user: string;
  text: string;
};

type Post = {
  id: number;
  image: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
  date: string;
  location: string;
  caption?: string;
};

const Profile = ({ role }: ProfileProps) => {
  const isCafe = role === "cafe";

  const [activeTab, setActiveTab] = useState<"photos" | "reviews" | "saved">(
    "photos"
  );
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [animateHeart, setAnimateHeart] = useState(false);

  const profile = {
    name: isCafe ? "Bean & Bloom Café" : "Harry Potter",
    username: isCafe ? "@beanandbloom" : "@thechosenone",
    bio: isCafe
      ? "Cozy neighborhood café ☕ • Study-friendly • Great pastries"
      : "Exploring the best cafés in NYC ☕✨",
    location: "New York, NY",
    stats: isCafe
      ? { photos: 42, rating: 4.8, visits: 5420 }
      : { visits: 27, points: 340, favorites: 12, streak: 5 },
    links: isCafe
      ? ["https://beanandbloom.com", "https://instagram.com/beanandbloom"]
      : [],
  };

  const mockPhotos = Array.from({ length: 12 });

  const [posts, setPosts] = useState<Post[]>(
    Array.from({ length: 9 }).map((_, i) => ({
      id: i,
      image: "https://via.placeholder.com/300",
      likes: Math.floor(Math.random() * 100),
      liked: false,
      comments: [
        { user: "Lorn", text: "Nice vibes ☕" },
        { user: "Bob", text: "Love this place!" },
      ],
      date: "Feb 22, 2026",
      location: "New York, NY",
      caption: "Study vibes ☕✨",
    }))
  );

  const mockSaved = [
    { id: 1, name: "Morning Brew", location: "Brooklyn" },
    { id: 2, name: "Velvet Roast", location: "Manhattan" },
  ];

    const [showAddPost, setShowAddPost] = useState(false);
    const [newPostCaption, setNewPostCaption] = useState("");
    const [newPostLocation, setNewPostLocation] = useState("");
    const [newPostImage, setNewPostImage] = useState<string | null>(null); // placeholder 

    const handleAddNewPost = () => {
    if (!newPostImage) return;
    const newPost: Post = {
        id: posts.length,
        image: newPostImage,
        likes: 0,
        liked: false,
        comments: [],
        date: new Date().toLocaleDateString(),
        location: newPostLocation || profile.location,
        caption: newPostCaption,
    };
    setPosts([newPost, ...posts]);
    setShowAddPost(false);
    setNewPostCaption("");
    setNewPostLocation("");
    setNewPostImage(null);
    };
  const handleLike = (id: number) => {
    setAnimateHeart(true);
    setTimeout(() => setAnimateHeart(false), 600);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              likes: p.liked ? p.likes - 1 : p.likes + 1,
              liked: !p.liked,
            }
          : p
      )
    );
  };

  const handleAddComment = () => {
    if (!commentInput.trim() || !selectedPost) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === selectedPost.id
          ? { ...p, comments: [...p.comments, { user: "You", text: commentInput }] }
          : p
      )
    );
    setCommentInput("");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-8 pb-6 border-b border-border">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-caramel to-primary flex items-center justify-center shadow-elevated">
              {isCafe ? (
                <Store className="h-10 w-10 text-primary-foreground" />
              ) : (
                <User className="h-10 w-10 text-primary-foreground" />
              )}
            </div>

            {/* Stats */}
            <div className="flex-1 flex justify-around text-center text-sm">
              {isCafe ? (
                <>
                  <div>
                    <p className="font-bold text-lg">{profile.stats.photos}</p>
                    <p className="text-muted-foreground">Photos</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{profile.stats.visits}</p>
                    <p className="text-muted-foreground">Visits</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{profile.stats.rating}</p>
                    <p className="text-muted-foreground">Rating</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-bold text-lg">{profile.stats.visits}</p>
                    <p className="text-muted-foreground">Visits</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{profile.stats.points}</p>
                    <p className="text-muted-foreground">Points</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{profile.stats.favorites}</p>
                    <p className="text-muted-foreground">Favorites</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Name + Bio + Links */}
          <div className="mt-4">
            <h1 className="font-semibold text-lg">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">{profile.username}</p>
            <p className="text-sm mt-2">{profile.bio}</p>

            {profile.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    className="text-sm text-blue-500 underline"
                  >
                    {link.replace(/^https?:\/\//, "")}
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              {profile.location}
            </div>

            {/*!isCafe && (
              <div className="flex items-center gap-3 mt-3 text-xs">
                <div className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                  <Coffee className="h-3 w-3 text-caramel" />
                  Study Mode
                </div>
                <div className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {profile.stats.streak} Day Streak
                </div>
              </div>
            )*/}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowEditProfile(true)}
            >
              Edit Profile
            </Button>
            <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => setShowAddPost(true)}
            >
            + Add Post
            </Button>
            <Button variant="secondary" className="rounded-xl">
              Share
            </Button>
          </div>
        </motion.div>
      </header>

      {/* Tabs */}
      <div className="max-w-lg mx-auto">
        <div className="flex justify-around border-b border-border">
          <button
            onClick={() => setActiveTab("photos")}
            className={`flex flex-col items-center py-3 text-xs ${
              activeTab === "photos"
                ? "border-b-2 border-foreground"
                : "text-muted-foreground"
            }`}
          >
            <Grid3X3 className="h-5 w-5" />
            Photos
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex flex-col items-center py-3 text-xs ${
              activeTab === "reviews"
                ? "border-b-2 border-foreground"
                : "text-muted-foreground"
            }`}
          >
            <Star className="h-5 w-5" />
            Reviews
          </button>

          {!isCafe && (
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex flex-col items-center py-3 text-xs ${
                activeTab === "saved"
                  ? "border-b-2 border-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Bookmark className="h-5 w-5" />
              Saved
            </button>
          )}
        </div>

        {/* Photos Grid */}
        {activeTab === "photos" && (
          <div className="grid grid-cols-3 gap-[2px] mt-1">
            {mockPhotos.map((_, idx) => (
              <div
                key={idx}
                className="relative aspect-square bg-muted hover:opacity-90 transition cursor-pointer"
                onClick={() => setSelectedPost(posts[idx % posts.length])}
              >
                <div className="absolute inset-0 hover:bg-black/20 transition" />
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        {activeTab === "reviews" && (
          <div className="p-4 space-y-3">
            <div className="bg-card border rounded-xl p-4">
              <p className="font-medium">Loved the vibe and lighting ✨</p>
              <p className="text-sm text-muted-foreground">
                Perfect study café with strong WiFi.
              </p>
            </div>
          </div>
        )}

        {/* Saved */}
        {activeTab === "saved" && !isCafe && (
          <div className="grid grid-cols-2 gap-3 p-4">
            {mockSaved.map((s) => (
              <div key={s.id} className="aspect-square rounded-xl bg-muted" />
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-background rounded-2xl w-full max-w-md p-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h2 className="font-semibold text-lg mb-4">Edit Profile</h2>
              <input
                placeholder="Name"
                className="w-full p-2 border rounded mb-2"
                defaultValue={profile.name}
              />
              <input
                placeholder="Username"
                className="w-full p-2 border rounded mb-2"
                defaultValue={profile.username}
              />
              <input
                placeholder="Bio"
                className="w-full p-2 border rounded mb-2"
                defaultValue={profile.bio}
              />
              <input
                placeholder="Location"
                className="w-full p-2 border rounded mb-2"
                defaultValue={profile.location}
              />
              <input
                placeholder="Links (comma separated)"
                className="w-full p-2 border rounded mb-2"
                defaultValue={profile.links.join(", ")}
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => setShowEditProfile(false)}>Cancel</Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowEditProfile(false)}
                >
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-background rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              {/* Left: Photo */}
              <div className="bg-muted w-full md:w-1/2 aspect-square flex items-center justify-center">
                <span className="text-muted-foreground font-bold">Photo</span>
              </div>

              {/* Right: Post Details */}
              <div className="flex-1 flex flex-col p-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-col">
                    <p className="font-semibold">{profile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPost.location}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedPost.date}</p>
                </div>

                {/* Caption */}
                <p className="text-sm mb-3">{selectedPost.caption}</p>

                {/* Actions */}
                <div className="flex items-center gap-4 mb-3">
                  <motion.button
                    onClick={() => handleLike(selectedPost.id)}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Heart
                      className={`h-6 w-6 transition-colors ${
                        selectedPost.liked ? "text-red-500" : "text-muted-foreground"
                      }`}
                    />
                  </motion.button>

                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                  <Share className="h-6 w-6 text-muted-foreground" />
                  <Bookmark className="h-6 w-6 text-muted-foreground ml-auto" />
                </div>

                <p className="text-sm font-semibold">{selectedPost.likes} likes</p>

                {/* Comments */}
                <div className="flex-1 overflow-y-auto mt-2 space-y-2">
                  {selectedPost.comments.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="font-semibold text-sm">{c.user}:</span>
                      <span className="text-sm">{c.text}</span>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="mt-3 flex gap-2">
                  <input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddComment();
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    onClick={handleAddComment}
                    className="rounded-full px-4 py-2 text-sm"
                  >
                    Post
                  </Button>
                </div>

                {/* Close Button */}
                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={() => setSelectedPost(null)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        <AnimatePresence>
        {showAddPost && (
            <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            >
            <motion.div
                className="bg-background rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
            >
                <h2 className="font-semibold text-lg mb-4">New Post</h2>

                {/* Photo/Video Upload */}
                <div
                className="w-full aspect-[4/3] bg-muted flex items-center justify-center mb-4 cursor-pointer rounded-lg"
                onClick={() => setNewPostImage("https://via.placeholder.com/300")} // For now, placeholder
                >
                {newPostImage ? (
                    <img src={newPostImage} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                    <span className="text-muted-foreground">Click to upload image/video</span>
                )}
                </div>

                {/* Caption */}
                <textarea
                value={newPostCaption}
                onChange={(e) => setNewPostCaption(e.target.value)}
                placeholder="Write a caption..."
                className="w-full p-2 border rounded mb-2 resize-none"
                />

                {/* Location */}
                <input
                value={newPostLocation}
                onChange={(e) => setNewPostLocation(e.target.value)}
                placeholder="Add location"
                className="w-full p-2 border rounded mb-2"
                />

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => setShowAddPost(false)}>Cancel</Button>
                <Button variant="secondary" onClick={handleAddNewPost}>
                    Post
                </Button>
                </div>
            </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

      <BottomNav role={role} />
    </div>
  );
};

export default Profile;