import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth";

const ROLE_LABEL: Record<string, string> = {
  sharoushi: "社労士",
  company_admin: "企業担当者",
  employee: "社員",
};

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color="#1e3a5f" />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{ROLE_LABEL[user?.role ?? ""] ?? user?.role}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
        <Text style={styles.logoutText}>ログアウト</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa", padding: 24 },
  profileCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 24,
    alignItems: "center", marginBottom: 24,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#eef2f8", justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: "bold", color: "#1e3a5f" },
  email: { fontSize: 14, color: "#888", marginTop: 4 },
  roleBadge: {
    marginTop: 10, backgroundColor: "#1e3a5f",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4,
  },
  roleText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#fff", borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: "#e74c3c",
  },
  logoutText: { color: "#e74c3c", fontWeight: "bold", fontSize: 16 },
});
