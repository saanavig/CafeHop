import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import Button from "./Button";
import { Heart, Bookmark, MessageCircle, MapPin, X } from "lucide-react-native";
import { scale, moderateScale } from "../../utils/responsive";

const { height, width } = Dimensions.get("window");
const CONTENT_WIDTH = Math.min(width * 0.85, 480);

export interface Comment {
  user: string;
  text: string;
}

export interface Post {
  cafeName: string;
  image: any;
  caption: string;
  likes: number;
  comments: number;
  postedBy: string;
  tags: string[];
  location?: string;
  commentList?: Comment[];
}

interface ForYouCardProps {
  post: Post;
  onModalToggle?: (isOpen: boolean) => void;
}

const ForYouCard = ({ post, onModalToggle }: ForYouCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likesState, setLikesState] = useState(post.likes);
  const [saved, setSaved] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [commentsState, setCommentsState] = useState(post.commentList || []);
  const [newComment, setNewComment] = useState("");

  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openComments = () => {
    setShowComments(true);
    onModalToggle?.(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: height * 0.45, duration: 250, useNativeDriver: false }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
    ]).start();
  };

  const closeComments = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: height, duration: 200, useNativeDriver: false }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start(() => {
      setShowComments(false);
      onModalToggle?.(false);
    });
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikesState(likesState + (liked ? -1 : 1));
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    setCommentsState([...commentsState, { user: "You", text: newComment }]);
    setNewComment("");
  };

  return (
    <View style={styles.cardWrapper}>
      <View style={[styles.card, { width: CONTENT_WIDTH }]}>
        <Image source={post.image} style={styles.image} />

        <View style={styles.overlay}>
          {/* Left: cafe info */}
          <View style={styles.contentContainer}>
            <Text style={styles.cafeName}>{post.cafeName}</Text>

            {post.location && (
              <View style={styles.locationRow}>
                <MapPin size={scale(12)} color="rgba(255,255,255,0.85)" />
                <Text style={styles.locationText}>{post.location}</Text>
              </View>
            )}

            <Text style={styles.caption}>{post.caption}</Text>

            <View style={styles.tags}>
              {post.tags.map((tag, i) => (
                <Text key={i} style={styles.tag}>#{tag}</Text>
              ))}
            </View>
          </View>

          {/* Right: action buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
              <Heart
                size={scale(26)}
                color={liked ? "#FF6B6B" : "#FFF"}
                fill={liked ? "#FF6B6B" : "transparent"}
                strokeWidth={liked ? 0 : 2}
              />
              <Text style={styles.actionText}>{likesState}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSaved(!saved)} style={styles.actionButton}>
              <Bookmark
                size={scale(26)}
                color={saved ? "#D4A373" : "#FFF"}
                fill={saved ? "#D4A373" : "transparent"}
                strokeWidth={saved ? 0 : 2}
              />
              <Text style={styles.actionText}>{saved ? "Saved" : "Save"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={openComments} style={styles.actionButton}>
              <MessageCircle size={scale(26)} color="#FFF" strokeWidth={2} />
              <Text style={styles.actionText}>{commentsState.length}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        transparent
        animationType="none"
        onRequestClose={closeComments}
        statusBarTranslucent
      >
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeComments}
          >
            <Animated.View
              style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)", opacity: backdropAnim }]}
            />
          </TouchableOpacity>

          <Animated.View style={[styles.modalContent, { top: slideAnim }]}>
            <View style={styles.dragBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={closeComments}>
                <X size={scale(20)} color="#555" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={commentsState}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <Text style={styles.commentText}>
                  <Text style={{ fontWeight: "bold" }}>{item.user}: </Text>
                  {item.text}
                </Text>
              )}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: scale(20) }}
              showsVerticalScrollIndicator={false}
            />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
              <View style={styles.commentRow}>
                <TextInput
                  placeholder="Add a comment..."
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                />
                <Button variant="caramel" size="sm" onPress={handlePostComment}>
                  Post
                </Button>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: { alignItems: "center", height: height - 180 },
  card: { height: height - 260, borderRadius: scale(20), overflow: "hidden", backgroundColor: "#000" },
  image: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(20),
    paddingBottom: scale(40),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  contentContainer: { flex: 1, marginRight: scale(20), marginBottom: scale(20) },
  cafeName: { color: "#FFF", fontSize: moderateScale(22), fontWeight: "600", marginBottom: scale(2) },
  locationRow: { flexDirection: "row", alignItems: "center", gap: scale(4), marginBottom: scale(6) },
  locationText: { color: "rgba(255,255,255,0.85)", fontSize: moderateScale(12) },
  caption: { color: "#FFF", fontSize: moderateScale(15), lineHeight: moderateScale(22), marginBottom: scale(6) },
  tags: { flexDirection: "row", flexWrap: "wrap" },
  tag: {
    backgroundColor: "rgba(212,163,115,0.25)",
    color: "#D4A373",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    fontSize: moderateScale(12),
    marginRight: scale(6),
    marginBottom: scale(4),
  },
  actionsContainer: {
    alignItems: "center",
    gap: scale(16),
    position: "absolute",
    right: scale(10),
    bottom: scale(60),
  },
  actionButton: {
    alignItems: "center",
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: "rgba(0,0,0,0.3)",
    minWidth: scale(44),
  },
  actionText: { color: "#FFF", fontSize: moderateScale(12), marginTop: scale(3) },
  modalContent: {
    position: "absolute",
    left: 0,
    right: 0,
    height: height * 0.55,
    backgroundColor: "#FFF",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    padding: scale(20),
  },
  dragBar: {
    width: scale(40), height: scale(5), backgroundColor: "#DDD",
    borderRadius: scale(3), alignSelf: "center", marginBottom: scale(10),
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: scale(16), paddingBottom: scale(12),
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  modalTitle: { fontSize: moderateScale(20), fontWeight: "600", color: "#2C1810" },
  commentRow: { flexDirection: "row", alignItems: "center", gap: scale(12) },
  commentInput: {
    flex: 1, borderWidth: 1, borderColor: "#E0E0E0",
    borderRadius: scale(20), paddingHorizontal: scale(16),
    paddingVertical: scale(10), fontSize: moderateScale(15),
    backgroundColor: "#F8F8F8",
  },
  commentText: { marginBottom: scale(8), fontSize: moderateScale(14) },
});

export default ForYouCard;
