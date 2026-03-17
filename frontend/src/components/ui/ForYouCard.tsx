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
import Button from "./Button"; // adjust import path if needed

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
      Animated.timing(slideAnim, {
        toValue: height * 0.45, // slide up from bottom
        duration: 250,
        useNativeDriver: false, // false because we're animating top
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const closeComments = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
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
          <View style={styles.contentContainer}>
            <Text style={styles.cafeName}>{post.cafeName}</Text>
            <Text style={styles.caption}>{post.caption}</Text>

            <View style={styles.tags}>
              {post.tags.map((tag, i) => (
                <Text key={i} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
              <Text style={styles.actionIcon}>{liked ? "❤️" : "🤍"}</Text>
              <Text style={styles.actionText}>{likesState}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSaved(!saved)} style={styles.actionButton}>
              <Text style={styles.actionIcon}>💾</Text>
              <Text style={styles.actionText}>{saved ? "Saved" : "Save"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={openComments} style={styles.actionButton}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>{commentsState.length}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Comments Modal — rendered at system level so BottomNav doesn't cover it */}
      <Modal
        visible={showComments}
        transparent
        animationType="none"
        onRequestClose={closeComments}
        statusBarTranslucent
      >
        <View style={{ flex: 1 }}>
          {/* Dim backdrop — tap to close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeComments}
          >
            <Animated.View
              style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)", opacity: backdropAnim }]}
            />
          </TouchableOpacity>

          {/* Sliding sheet */}
          <Animated.View style={[styles.modalContent, { top: slideAnim }]}>
            <View style={styles.dragBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={closeComments}>
                <Text style={{ fontSize: 18 }}>✕</Text>
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
              contentContainerStyle={{ paddingBottom: 20 }}
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
  card: { height: height - 260, borderRadius: 20, overflow: "hidden", backgroundColor: "#000" },
  image: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  contentContainer: { flex: 1, marginRight: 20, marginBottom: 20 },
  cafeName: { color: "#FFF", fontSize: 22, fontWeight: "600", marginBottom: 2 },
  caption: { color: "#FFF", fontSize: 16, lineHeight: 22, marginBottom: 6 },
  tags: { flexDirection: "row", flexWrap: "wrap" },
  tag: {
    backgroundColor: "rgba(212,163,115,0.2)",
    color: "#D4A373",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  actionsContainer: { alignItems: "center", gap: 16, position: "absolute", right: 10, bottom: 60 },
  actionButton: { alignItems: "center", padding: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)" },
  actionIcon: { fontSize: 22, marginBottom: 4 },
  actionText: { color: "#FFF", fontSize: 12 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  backdropTouchable: { flex: 1, width: "100%" },
  modalContent: {
    position: "absolute",
    left: 0,
    right: 0,
    height: height * 0.55,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  dragBar: { width: 40, height: 5, backgroundColor: "#DDD", borderRadius: 3, alignSelf: "center", marginBottom: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  modalTitle: { fontSize: 20, fontWeight: "600", color: "#2C1810" },
  commentRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, backgroundColor: "#F8F8F8" },
  commentText: { marginBottom: 8 },
});

export default ForYouCard;