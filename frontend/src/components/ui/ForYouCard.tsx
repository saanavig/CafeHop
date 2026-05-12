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
import React, { useEffect, useRef, useState } from "react";
import { ResizeMode, Video } from "expo-av";
import {
  deviceHeight,
  deviceWidth,
  moderateScale,
  scale,
} from "../../utils/responsive";

import Button from "./Button";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

const CARD_WIDTH = deviceWidth * 0.88;

export interface Comment {
  id?: string;
  username?: string;
  content?: string;
  user?: string;
  text?: string;
}

export interface Post {
  id: string;
  cafeName: string;
  image: any;
  images?: string[];
  caption: string;
  likes: number;
  comments: number;

  liked?: boolean;
  saved?: boolean;
  liked_by_user?: boolean;
  saved_by_user?: boolean;

  postedBy: string;
  postedById?: string;
  postedByType?: "user" | "cafe_owner";
  tags: string[];
  location?: string;
  commentList?: Comment[];
  mediaType?: "image" | "video" | string;
}

interface ForYouCardProps {
  post: Post;
  listHeight?: number;
  onModalToggle?: (isOpen: boolean) => void;
  currentUserType?: "user" | "cafe_owner";

  onLike?: (postId: string, currentlyLiked: boolean) => Promise<void> | void;
  onSave?: (postId: string, currentlySaved: boolean) => Promise<void> | void;
  onFetchComments?: (postId: string) => Promise<Comment[]>;
  onPostComment?: (postId: string, content: string) => Promise<Comment | null>;
}

const ForYouCard = ({
  post,
  listHeight,
  onModalToggle,
  currentUserType,
  onLike,
  onSave,
  onFetchComments,
  onPostComment,
}: ForYouCardProps) => {
  const wrapperH = listHeight ?? deviceHeight - 180;
  const cardH = wrapperH * 0.97;

  const { colors: themeColors } = useTheme();
  const navigation = useNavigation<any>();

  const liked = Boolean(post.liked ?? post.liked_by_user ?? false);
  const saved = Boolean(post.saved ?? post.saved_by_user ?? false);
  const likesState = Number(post.likes || 0);
  const commentsCount = Number(post.comments || 0);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [commentsState, setCommentsState] = useState<Comment[]>(
    post.commentList || []
  );
  const [newComment, setNewComment] = useState("");

  const slideAnim = useRef(new Animated.Value(deviceHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setCommentsState(post.commentList || []);
  }, [post.id, post.commentList]);

  const fetchComments = async () => {
    if (!onFetchComments) return;

    try {
      const comments = await onFetchComments(post.id);
      setCommentsState(Array.isArray(comments) ? comments : []);
    } catch (err) {
      console.error("Fetch comments error:", err);
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

  const handleProfilePress = () => {
    if (!post.postedById) return;

    if (post.postedByType === "cafe_owner") {
      navigation.navigate("CafeProfile", {
        cafeId: post.postedById,
      });
    } else {
      navigation.navigate("UserProfile", {
        userId: post.postedById,
      });
    }
  };

  const handleLikePress = async () => {
    if (!post.id || post.id.startsWith("cafe-")) return;
    if (loadingLike) return;

    try {
      setLoadingLike(true);
      await onLike?.(post.id, liked);
    } catch (err) {
      console.error("Like action error:", err);
    } finally {
      setLoadingLike(false);
    }
  };

  const handleSavePress = async () => {
    if (!post.id || post.id.startsWith("cafe-")) return;
    if (loadingSave) return;

    try {
      setLoadingSave(true);
      await onSave?.(post.id, saved);
    } catch (err) {
      console.error("Save action error:", err);
    } finally {
      setLoadingSave(false);
    }
  };

  const handlePostCommentPress = async () => {
    if (!post.id || post.id.startsWith("cafe-")) return;
    if (!newComment.trim()) return;
    if (loadingComment) return;

    const content = newComment.trim();

    try {
      setLoadingComment(true);

      const createdComment = await onPostComment?.(post.id, content);

      if (createdComment) {
        setCommentsState((prev) => [createdComment, ...prev]);
      }

      setNewComment("");
    } catch (err) {
      console.error("Post comment action error:", err);
    } finally {
      setLoadingComment(false);
    }
  };

  return (
    <View style={[styles.cardWrapper, { height: wrapperH }]}>
      <View style={[styles.card, { width: CARD_WIDTH, height: cardH }]}>
        {post.images && post.images.length > 1 ? (
          <FlatList
            data={post.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.image}
            keyExtractor={(_, i) => i.toString()}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
              setCarouselIndex(idx);
            }}
            onScrollEndDrag={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
              setCarouselIndex(idx);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width: CARD_WIDTH, height: cardH }}
                resizeMode="cover"
              />
            )}
          />
        ) : post.mediaType === "video" ? (
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

        {post.images && post.images.length > 1 && (
          <View style={styles.dotsRow}>
            {post.images.map((_, i) => (
              <View key={i} style={[styles.dot, i === carouselIndex && styles.dotActive]} />
            ))}
          </View>
        )}

        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            <Text style={styles.cafeName}>{post.cafeName}</Text>

            {post.location && (
              <View style={styles.locationRow}>
                <MapPin size={scale(12)} color="rgba(255,255,255,0.85)" />
                <Text style={styles.locationText}>{post.location}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.postedByRow}
              onPress={handleProfilePress}
              activeOpacity={0.8}
            >
              <Text style={styles.postedByText}>
                Posted by{" "}
                <Text style={styles.postedByUsername}>{post.postedBy}</Text>
              </Text>
            </TouchableOpacity>

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
              onPress={handleLikePress}
              style={styles.actionButton}
              disabled={loadingLike}
            >
              <Heart
                size={scale(26)}
                color={liked ? "#FF6B6B" : "#FFF"}
                fill={liked ? "#FF6B6B" : "transparent"}
                strokeWidth={liked ? 0 : 2}
              />
              <Text style={styles.actionText}>{likesState}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={openComments} style={styles.actionButton}>
              <MessageCircle size={scale(26)} color="#FFF" strokeWidth={2} />
              <Text style={styles.actionText}>{commentsCount}</Text>
            </TouchableOpacity>

            {currentUserType === "user" && (
              <TouchableOpacity
                onPress={handleSavePress}
                style={styles.actionButton}
                disabled={loadingSave}
              >
                <Bookmark
                  size={scale(26)}
                  color={saved ? "#D4A373" : "#FFF"}
                  fill={saved ? "#D4A373" : "transparent"}
                  strokeWidth={saved ? 0 : 2}
                />
                <Text style={styles.actionText}>{saved ? "Saved" : "Save"}</Text>
              </TouchableOpacity>
            )}
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

          <Animated.View style={[styles.modalContent, { top: slideAnim, backgroundColor: themeColors.card }]}>
            <View style={[styles.dragBar, { backgroundColor: themeColors.border }]} />

            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Comments</Text>

              <TouchableOpacity onPress={closeComments}>
                <X size={scale(20)} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={commentsState}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={({ item }) => (
                <Text style={[styles.commentText, { color: themeColors.text }]}>
                  <Text style={{ fontWeight: "bold" }}>
                    {(item.username || item.user || "User") + ": "}
                  </Text>
                  {item.content || item.text}
                </Text>
              )}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingBottom: scale(20),
              }}
              showsVerticalScrollIndicator={false}
            />

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View style={styles.commentRow}>
                <TextInput
                  placeholder="Add a comment..."
                  placeholderTextColor={themeColors.textMuted}
                  style={[styles.commentInput, { backgroundColor: themeColors.iconBg, borderColor: themeColors.border, color: themeColors.text }]}
                  value={newComment}
                  onChangeText={setNewComment}
                />

                <Button
                  variant="caramel"
                  size="sm"
                  onPress={handlePostCommentPress}
                >
                  <Text>{loadingComment ? "..." : "Post"}</Text>
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
  dotsRow: {
    position: "absolute",
    top: scale(14),
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: scale(5),
  },
  dot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: {
    backgroundColor: "#FFF",
    width: scale(18),
    borderRadius: scale(3),
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
  postedByRow: {
    marginBottom: scale(6),
  },
  postedByText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: moderateScale(12),
  },
  postedByUsername: {
    color: "#FFF",
    fontWeight: "600",
  },
});

export default ForYouCard;