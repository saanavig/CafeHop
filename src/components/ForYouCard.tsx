import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";

interface ForYouCardProps {
  cafeName: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  postedBy: string;
  tags: string[];
  index?: number;
}

const ForYouCard = ({
  cafeName,
  image,
  caption,
  likes,
  comments,
  postedBy,
  tags,
  index = 0,
}: ForYouCardProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/50"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={cafeName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
        
        {/* Overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <Badge className="mb-2 bg-caramel/90 text-cream hover:bg-caramel border-0">
            {cafeName}
          </Badge>
          <p className="text-cream text-sm line-clamp-2 font-medium">
            {caption}
          </p>
        </div>

        {/* Action buttons */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setLiked(!liked)}
            className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
              liked ? "bg-destructive text-cream" : "bg-cream/20 text-cream"
            }`}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSaved(!saved)}
            className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
              saved ? "bg-caramel text-cream" : "bg-cream/20 text-cream"
            }`}
          >
            <Bookmark className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
          </motion.button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {liked ? likes + 1 : likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {comments}
            </span>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Posted by <span className="font-medium text-foreground">{postedBy}</span>
        </p>
        
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag) => (
            <span key={tag} className="text-xs text-caramel">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ForYouCard;
