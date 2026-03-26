import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ForYouCard, { Post } from "../components/ui/ForYouCard";
import React, { useEffect, useRef, useState } from "react";
import { moderateScale, scale } from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import { Search } from "lucide-react-native";

const { height } = Dimensions.get("window");
const CARD_HEIGHT = height - 180;

const initialPosts: Post[] = [
  {
    cafeName: "The Roastery",
    image: { uri: "https://picsum.photos/500/700?1" },
    caption: "Perfect study spot ☕",
    likes: 234,
    comments: 18,
    postedBy: "Sarah",
    tags: ["studyspot", "cozy"],
    location: "Brooklyn, NY",
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
    location: "Williamsburg, NY",
    commentList: [{ user: "Nina", text: "Love this place!" }],
  },
];

const Index = () => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const flatListRef = useRef<FlatList<Post>>(null);

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
      <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        <Text style={styles.title}>CAFEHOP</Text>

        {/* Search bar — icon + input row, consistent with Explore */}
        <View style={styles.searchRow}>
          <Search size={scale(18)} color="#AAA" style={{ marginRight: scale(8) }} />
          <TextInput
            placeholder="Search posts..."
            placeholderTextColor="#AAA"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </Animated.View>

      {/* TikTok-style vertical feed */}
      <FlatList
        ref={flatListRef}
        data={posts.filter((p) =>
          p.caption.toLowerCase().includes(search.toLowerCase()) ||
          p.cafeName.toLowerCase().includes(search.toLowerCase())
        )}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <ForYouCard post={item} onModalToggle={(isOpen) => setModalOpen(isOpen)} />
        )}
        scrollEnabled={!modalOpen}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: CARD_HEIGHT,
          offset: CARD_HEIGHT * index,
          index,
        })}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: 0 }}
      />

      <BottomNav />
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F3F0" },
  header: {
    paddingTop: scale(30),
    paddingBottom: scale(14),
    paddingHorizontal: scale(16),
    alignItems: "center",
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: scale(12),
    color: "#2C1810",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: scale(16),
    paddingHorizontal: scale(14),
    paddingVertical: scale(11),
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    color: "#1A1A1A",
    padding: 0,
  },
});
