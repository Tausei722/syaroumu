import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Modal, TextInput, Alert, Image,
  ImageBackground, ScrollView, StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { getTimeline, createTimelinePost, deleteTimelinePost } from "../../services/api";
import { useAuthStore } from "../../store/auth";
import { useThemeStore } from "../../store/theme";

interface Post {
  id: string;
  title: string;
  content: string;
  category: "news" | "announcement" | "reminder" | "report";
  cover_image_url: string | null;
  is_pinned: boolean;
  created_at: string;
  posted_by: string;
}

const CATEGORY_CONFIG = {
  news:         { label: "労務ニュース", color: "#e74c3c", icon: "newspaper" as const },
  announcement: { label: "お知らせ",   color: "#3498db", icon: "megaphone" as const },
  reminder:     { label: "リマインダー", color: "#e67e22", icon: "alarm" as const },
  report:       { label: "業務報告",   color: "#27ae60", icon: "document-text" as const },
};

const CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([value, cfg]) => ({ value, ...cfg }));

export default function TimelineScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // 投稿フォーム
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("announcement");
  const [newCoverUrl, setNewCoverUrl] = useState("");

  const user = useAuthStore((s) => s.user);
  const theme = useThemeStore();

  const bgColor = theme.effectiveBgColor();
  const primary = theme.primaryColor;
  const fontFamily = theme.effectiveFontFamily();
  const scale = theme.fontScale();

  const fetchPosts = async () => {
    try {
      const { data } = await getTimeline(user?.company_id ?? undefined);
      setPosts(data);
    } catch {
      Alert.alert("エラー", "お知らせの取得に失敗しました");
    }
  };

  useEffect(() => {
    fetchPosts();
    if (user?.company_id) theme.loadCompanyTheme(user.company_id);
    theme.loadUserTheme();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handlePost = async () => {
    if (!newTitle || !newContent) {
      Alert.alert("入力エラー", "タイトルと本文を入力してください");
      return;
    }
    try {
      await createTimelinePost({
        title: newTitle,
        content: newContent,
        category: newCategory,
        cover_image_url: newCoverUrl || null,
        send_push: true,
      });
      setNewTitle(""); setNewContent(""); setNewCoverUrl("");
      setModalVisible(false);
      await fetchPosts();
    } catch {
      Alert.alert("エラー", "投稿に失敗しました");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("削除確認", "この投稿を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: async () => {
        await deleteTimelinePost(id);
        setSelectedPost(null);
        await fetchPosts();
      }},
    ]);
  };

  const filtered = filter === "all" ? posts : posts.filter((p) => p.category === filter);

  const renderCard = ({ item }: { item: Post }) => {
    const cat = CATEGORY_CONFIG[item.category];
    return (
      <TouchableOpacity
        style={[styles.card, { fontFamily }]}
        onPress={() => setSelectedPost(item)}
        activeOpacity={0.85}
      >
        {item.cover_image_url ? (
          <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: cat.color + "22" }]}>
            <Ionicons name={cat.icon} size={40} color={cat.color} />
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={[styles.categoryBadge, { backgroundColor: cat.color }]}>
            <Ionicons name={cat.icon} size={11} color="#fff" />
            <Text style={styles.categoryText}>{cat.label}</Text>
          </View>

          {item.is_pinned && (
            <View style={[styles.pinBadge, { backgroundColor: primary }]}>
              <Ionicons name="pin" size={10} color="#fff" />
              <Text style={styles.pinText}>固定</Text>
            </View>
          )}

          <Text
            style={[styles.cardTitle, { fontFamily, fontSize: 16 * scale }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.cardExcerpt, { fontFamily, fontSize: 13 * scale }]}
            numberOfLines={3}
          >
            {item.content}
          </Text>
          <Text style={styles.cardDate}>
            {dayjs(item.created_at).format("YYYY/MM/DD HH:mm")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={theme.bgImageUrl ? { uri: theme.bgImageUrl } : undefined}
      style={[styles.container, { backgroundColor: bgColor }]}
    >
      <StatusBar barStyle="light-content" />

      {/* カテゴリフィルター */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, filter === "all" && { backgroundColor: primary }]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>
            すべて
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.filterChip, filter === cat.value && { backgroundColor: cat.color }]}
            onPress={() => setFilter(cat.value)}
          >
            <Ionicons
              name={cat.icon}
              size={12}
              color={filter === cat.value ? "#fff" : cat.color}
            />
            <Text style={[styles.filterText, filter === cat.value && styles.filterTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="newspaper-outline" size={48} color="#ccc" />
            <Text style={styles.empty}>投稿はありません</Text>
          </View>
        }
      />

      {user?.role === "sharoushi" && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: primary }]} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* 記事詳細モーダル */}
      <Modal visible={!!selectedPost} animationType="slide" presentationStyle="pageSheet">
        {selectedPost && (() => {
          const cat = CATEGORY_CONFIG[selectedPost.category];
          return (
            <ScrollView style={styles.detailModal}>
              {selectedPost.cover_image_url ? (
                <Image source={{ uri: selectedPost.cover_image_url }} style={styles.detailCover} />
              ) : (
                <View style={[styles.detailCoverPlaceholder, { backgroundColor: cat.color + "33" }]}>
                  <Ionicons name={cat.icon} size={60} color={cat.color} />
                </View>
              )}
              <View style={styles.detailContent}>
                <View style={[styles.categoryBadge, { backgroundColor: cat.color, alignSelf: "flex-start" }]}>
                  <Ionicons name={cat.icon} size={11} color="#fff" />
                  <Text style={styles.categoryText}>{cat.label}</Text>
                </View>
                <Text style={[styles.detailTitle, { fontFamily, fontSize: 22 * scale }]}>
                  {selectedPost.title}
                </Text>
                <Text style={styles.detailDate}>
                  {dayjs(selectedPost.created_at).format("YYYY年MM月DD日 HH:mm")}
                </Text>
                <View style={styles.divider} />
                <Text style={[styles.detailBody, { fontFamily, fontSize: 15 * scale, lineHeight: 26 * scale }]}>
                  {selectedPost.content}
                </Text>

                <View style={styles.detailActions}>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPost(null)}>
                    <Text style={styles.closeBtnText}>閉じる</Text>
                  </TouchableOpacity>
                  {user?.role === "sharoushi" && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(selectedPost.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                      <Text style={styles.deleteBtnText}>削除</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          );
        })()}
      </Modal>

      {/* 投稿作成モーダル */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.postModal}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: primary }]}>新規投稿</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>カテゴリ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.catOption,
                  newCategory === cat.value && { backgroundColor: cat.color, borderColor: cat.color },
                ]}
                onPress={() => setNewCategory(cat.value)}
              >
                <Ionicons name={cat.icon} size={14} color={newCategory === cat.value ? "#fff" : cat.color} />
                <Text style={[styles.catOptionText, newCategory === cat.value && { color: "#fff" }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>タイトル</Text>
          <TextInput
            style={styles.input}
            placeholder="記事タイトル"
            value={newTitle}
            onChangeText={setNewTitle}
          />

          <Text style={styles.label}>カバー画像URL（任意）</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            value={newCoverUrl}
            onChangeText={setNewCoverUrl}
            autoCapitalize="none"
          />

          <Text style={styles.label}>本文</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="記事の内容を入力..."
            value={newContent}
            onChangeText={setNewContent}
            multiline
            numberOfLines={8}
          />

          <TouchableOpacity style={[styles.postButton, { backgroundColor: primary }]} onPress={handlePost}>
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.postButtonText}>投稿してプッシュ通知を送る</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterBar: { maxHeight: 52, backgroundColor: "rgba(255,255,255,0.9)" },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: "row" },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#dde3ec",
  },
  filterText: { fontSize: 12, color: "#555" },
  filterTextActive: { color: "#fff", fontWeight: "bold" },
  list: { padding: 14, gap: 16 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  coverImage: { width: "100%", height: 180 },
  coverPlaceholder: { width: "100%", height: 120, justifyContent: "center", alignItems: "center" },
  cardBody: { padding: 14 },
  categoryBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: "flex-start", marginBottom: 8,
  },
  categoryText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  pinBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    alignSelf: "flex-start", marginBottom: 6,
  },
  pinText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  cardTitle: { fontWeight: "bold", color: "#1a1a2e", marginBottom: 6 },
  cardExcerpt: { color: "#555", lineHeight: 20, marginBottom: 10 },
  cardDate: { fontSize: 11, color: "#aaa" },
  emptyBox: { alignItems: "center", marginTop: 80, gap: 12 },
  empty: { color: "#bbb", fontSize: 15 },
  fab: {
    position: "absolute", bottom: 24, right: 24,
    width: 58, height: 58, borderRadius: 29,
    justifyContent: "center", alignItems: "center", elevation: 8,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8,
  },
  // 詳細モーダル
  detailModal: { flex: 1, backgroundColor: "#fff" },
  detailCover: { width: "100%", height: 240 },
  detailCoverPlaceholder: { width: "100%", height: 160, justifyContent: "center", alignItems: "center" },
  detailContent: { padding: 20 },
  detailTitle: { fontWeight: "bold", color: "#1a1a2e", marginTop: 12, marginBottom: 6 },
  detailDate: { fontSize: 12, color: "#aaa", marginBottom: 12 },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginBottom: 16 },
  detailBody: { color: "#333" },
  detailActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 32, marginBottom: 40 },
  closeBtn: { backgroundColor: "#eee", borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  closeBtnText: { fontWeight: "bold", color: "#333" },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 12 },
  deleteBtnText: { color: "#e74c3c", fontWeight: "bold" },
  // 投稿モーダル
  postModal: { flex: 1, padding: 20, backgroundColor: "#fff" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  catOption: {
    flexDirection: "row", alignItems: "center", gap: 6, marginRight: 8,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "#dde3ec",
  },
  catOptionText: { fontSize: 13, color: "#555" },
  input: {
    borderWidth: 1, borderColor: "#dde3ec", borderRadius: 10,
    padding: 12, marginBottom: 16, fontSize: 15, backgroundColor: "#fafafa",
  },
  textarea: { height: 180, textAlignVertical: "top" },
  postButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 10, padding: 16, marginBottom: 40,
  },
  postButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
