import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  X,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  deviceHeight,
  deviceWidth,
  moderateScale,
  scale,
} from "../../utils/responsive";

import Button from "./Button";
import { apiFetch } from "../../api/client";
import { ResizeMode, Video } from "expo-av";

const CARD_WIDTH = deviceWidth * 0.88;

export interface Comment {
  user: string;
  text: string;
}

export interface Post {
  id: string;
  cafeName: string;
  image: any;
  caption: string;
  likes: number;
  comments: number;
  postedBy: string;
  tags: string[];
  location?: string;
  commentList?: Comment[];
  liked_by_user?: boolean;
  saved_by_user?: boolean;
  mediaType?: "image" | "video" | string;
}

interface ForYouCardProps {
  post: Post;
  listHeight?: number;
  onModalToggle?: (isOpen: boolean) => void;
}

const ForYouCard = ({
  post,
  listHeight,
  onModalToggle,
}: ForYouCardProps) => {
  const wrapperH = listHeight ?? deviceHeight - 180;
  const cardH = wrapperH * 0.97;

  const [liked, setLiked] = useState(post.liked_by_user ?? false);
  const [saved, setSaved] = useState(post.saved_by_user ?? false);
  const [likesState, setLikesState] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [loadingLike, setLoadingLike] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [commentsState, setCommentsState] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  const slideAnim = useRef(new Animated.Value(deviceHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const fetchComments = async () => {
    try {
      const res = await apiFetch(`/posts/${post.id}/comments`);
      const data = await res.json();

      setCommentsState(data);
      setCommentsCount(data.length);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const openComments = () => {
    if (!post.id || post.id.startsWith("cafe-")) return;

    if (commentsState.length === 0) {
      fetchComments();
    }

    setShowComments(true);
    onModalToggle?.(true);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: deviceHeight * 0.45,
        duration: 250,
        useNativeDriver: false,
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
        toValue: deviceHeight,
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

  const handleLike = async () => {
    if (!post.id || post.id.startsWith("cafe-")) return;
    if (loadingLike) return;

    const newLiked = !liked;

    setLiked(newLiked);
    setLikesState((prev) =>
      newLiked ? prev + 1 : Math.max(0, prev - 1)
    );

    setLoadingLike(true);

    try {
      await apiFetch(`/posts/${post.id}/like`, {
        method: newLiked ? "POST" : "DELETE",
      });
    } catch (err) {
      setLiked(!newLiked);
      setLikesState((prev) =>
        newLiked ? prev - 1 : prev + 1
      );
      console.error("Like error:", err);
    } finally {
      setLoadingLike(false);
    }
  };

  const handlePostComment = async () => {
    if (!post.id || post.id.startsWith("cafe-")) return;
    if (!newComment.trim()) return;

    try {
      const res = await apiFetch(`/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content: newComment,
        }),
      });

      const data = await res.json();

      setCommentsState((prev: any) => {
        const newItem = {
          ...data,
          username: "You",
        };

        const updated = [newItem, ...prev];
        setCommentsCount(updated.length);
        return updated;
      });

      setNewComment("");
    } catch (err) {
      console.error("Post error:", err);
    }
  };

  const handleSave = async () => {
    if (!post.id || post.id.startsWith("cafe-")) return;

    const newState = !saved;
    setSaved(newState);

    try {
      if (newState) {
        await apiFetch(`/posts/${post.id}/save`, {
          method: "POST",
        });
      } else {
        await apiFetch(`/posts/${post.id}/save`, {
          method: "DELETE",
        });
      }
    } catch (err) {
      setSaved(!newState);
      console.error("Save error:", err);
    }
  };

  return (
    <View style={[styles.cardWrapper, { height: wrapperH }]}>
      <View style={[styles.card, { width: CARD_WIDTH, height: cardH }]}>
        {post.mediaType === "video" ? (
          <Video
            source={post.image}
            style={styles.image}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
        ) : (
          <Image source={post.image} style={styles.image} />
        )}

        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            <Text style={styles.cafeName}>{post.cafeName}</Text>

            {post.location && (
              <View style={styles.locationRow}>
                <MapPin
                  size={scale(12)}
                  color="rgba(255,255,255,0.85)"
                />
                <Text style={styles.locationText}>
                  {post.location}
                </Text>
              </View>
            )}

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
            <TouchableOpacity
              onPress={handleLike}
              style={styles.actionButton}
            >
              <Heart
                size={scale(26)}
                color={liked ? "#FF6B6B" : "#FFF"}
                fill={liked ? "#FF6B6B" : "transparent"}
                strokeWidth={liked ? 0 : 2}
              />
              <Text style={styles.actionText}>
                {likesState}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openComments}
              style={styles.actionButton}
            >
              <MessageCircle
                size={scale(26)}
                color="#FFF"
                strokeWidth={2}
              />
              <Text style={styles.actionText}>
                {commentsCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={styles.actionButton}
            >
              <Bookmark
                size={scale(26)}
                color={saved ? "#D4A373" : "#FFF"}
                fill={saved ? "#D4A373" : "transparent"}
                strokeWidth={saved ? 0 : 2}
              />
              <Text style={styles.actionText}>
                {saved ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: "rgba(0,0,0,0.4)",
                  opacity: backdropAnim,
                },
              ]}
            />
          </TouchableOpacity>

          <Animated.View
            style={[styles.modalContent, { top: slideAnim }]}
          >
            <View style={styles.dragBar} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>

              <TouchableOpacity onPress={closeComments}>
                <X size={scale(20)} color="#555" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={commentsState}
              keyExtractor={(item, index) =>
                item.id || index.toString()
              }
              renderItem={({ item }) => (
                <Text style={styles.commentText}>
                  <Text style={{ fontWeight: "bold" }}>
                    {(item.username ?? "User") + ": "}
                  </Text>
                  {item.content}
                </Text>
              )}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingBottom: scale(20),
              }}
              showsVerticalScrollIndicator={false}
            />

            <KeyboardAvoidingView
              behavior={
                Platform.OS === "ios" ? "padding" : undefined
              }
            >
              <View style={styles.commentRow}>
                <TextInput
                  placeholder="Add a comment..."
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                />

                <Button
                  variant="caramel"
                  size="sm"
                  onPress={handlePostComment}
                >
                  <Text>Post</Text>
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
  cardWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: scale(20),
    overflow: "hidden",
    backgroundColor: "#000",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: scale(16),
    paddingTop: scale(40),
    paddingBottom: scale(32),
    flexDirection: "row",
    alignItems: "flex-end",
  },
  contentContainer: {
    flex: 1,
    marginRight: scale(12),
  },
  cafeName: {
    color: "#FFF",
    fontSize: moderateScale(18),
    fontWeight: "700",
    marginBottom: scale(2),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginBottom: scale(4),
  },
  locationText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: moderateScale(12),
  },
  caption: {
    color: "#FFF",
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    marginBottom: scale(6),
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "rgba(212,163,115,0.25)",
    color: "#D4A373",
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(12),
    fontSize: moderateScale(11),
    marginRight: scale(6),
    marginBottom: scale(4),
  },
  actionsContainer: {
    alignItems: "center",
    gap: scale(20),
    paddingBottom: scale(4),
  },
  actionButton: {
    alignItems: "center",
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: "rgba(0,0,0,0.3)",
    minWidth: scale(44),
  },
  actionText: {
    color: "#FFF",
    fontSize: moderateScale(11),
    marginTop: scale(2),
  },
  modalContent: {
    position: "absolute",
    left: 0,
    right: 0,
    height: deviceHeight * 0.55,
    backgroundColor: "#FFF",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    padding: scale(20),
  },
  dragBar: {
    width: scale(40),
    height: scale(5),
    backgroundColor: "#DDD",
    borderRadius: scale(3),
    alignSelf: "center",
    marginBottom: scale(10),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(16),
    paddingBottom: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    color: "#2C1810",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: scale(20),
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    fontSize: moderateScale(15),
    backgroundColor: "#F8F8F8",
  },
  commentText: {
    marginBottom: scale(8),
    fontSize: moderateScale(14),
  },
});

export default ForYouCard;