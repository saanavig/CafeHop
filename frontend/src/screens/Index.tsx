import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import ForYouCard, { Post } from "../components/ui/ForYouCard";
import BottomNav from "../components/ui/BottomNav";

const { height, width } = Dimensions.get("window");
const CONTENT_WIDTH = Math.min(width * 0.85, 480);
const CARD_HEIGHT = height - 180; // wrapper height = FlatList snap interval

const initialPosts: Post[] = [
  {
    cafeName: "The Roastery",
    image: { uri: "https://picsum.photos/500/700?1" },
    caption: "Perfect study spot ☕",
    likes: 234,
    comments: 18,
    postedBy: "Sarah",
    tags: ["studyspot", "cozy"],
    commentList: [{ user: "Alex", text: "Looks great!" }],
  },
  {
    cafeName: "Bean & Leaf",
    image: { uri: "https://picsum.photos/500/700?2" },
    caption: "Latte art is insane 😍",
    likes: 456,
    comments: 32,
    postedBy: "James",
    tags: ["latteart"],
    commentList: [{ user: "Nina", text: "Love this place!" }],
  },
];

const Index = () => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const flatListRef = useRef<FlatList<Post>>(null);

  // Header fade-in
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadMore = () => setPosts((prev) => [...prev, ...initialPosts]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { width: CONTENT_WIDTH, opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        <Text style={styles.title}>CAFÉHOP</Text>
        <TextInput
          placeholder="Search posts..."
          style={[styles.search, { width: CONTENT_WIDTH }]}
          value={search}
          onChangeText={setSearch}
        />
      </Animated.View>

      {/* TikTok-style vertical feed */}
      <FlatList
        ref={flatListRef}
        data={posts.filter((p) =>
          p.caption.toLowerCase().includes(search.toLowerCase())
        )}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <ForYouCard post={item} onModalToggle={(isOpen) => setModalOpen(isOpen)} />
        )}
        scrollEnabled={!modalOpen} // block scrolling when modal open
        showsVerticalScrollIndicator={false}

        // --- snapping settings ---
        pagingEnabled
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: CARD_HEIGHT,
          offset: CARD_HEIGHT * index,
          index,
        })}

        // load more posts
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}

        contentContainerStyle={{ paddingBottom: 0 }}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F3F0", alignItems: "center" },
  header: { paddingTop: 30, paddingBottom: 20, alignItems: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: 12,
    color: "#2C1810",
  },
  search: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});