import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image, StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { login, getMe } from "../../services/api";
import { useAuthStore } from "../../store/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("入力エラー", "メールアドレスとパスワードを入力してください");
      return;
    }
    setLoading(true);
    try {
      const { data } = await login(email, password);
      const meRes = await getMe();
      await setAuth(data.access_token, meRes.data);
      router.replace("/(tabs)/timeline");
    } catch {
      Alert.alert("ログイン失敗", "メールアドレスまたはパスワードが正しくありません");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* 上部ネイビー背景エリア */}
      <View style={styles.topArea}>
        <View style={styles.iconWrap}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>社労士業務管理</Text>
        <Text style={styles.tagline}>社会保険労務士のための業務支援アプリ</Text>
      </View>

      {/* カードエリア */}
      <KeyboardAvoidingView
        style={styles.cardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ログイン</Text>

          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              placeholderTextColor="#bbb"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#999" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="パスワード"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18} color="#aaa"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <Text style={styles.loginBtnText}>ログイン</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2025 社労士業務管理システム</Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f0f4f8" },

  topArea: {
    backgroundColor: "#1e3a5f",
    paddingTop: 80,
    paddingBottom: 48,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  iconWrap: {
    width: 88, height: 88, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  icon: { width: 72, height: 72, borderRadius: 16 },
  appName: { fontSize: 24, fontWeight: "bold", color: "#fff", letterSpacing: 1 },
  tagline: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 6 },

  cardWrap: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 18, fontWeight: "bold", color: "#1e3a5f",
    marginBottom: 24, textAlign: "center",
  },

  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#dde3ec",
    borderRadius: 10, marginBottom: 14,
    backgroundColor: "#f8fafc", paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: "#333", paddingVertical: 13 },
  eyeBtn: { padding: 4 },

  loginBtn: {
    backgroundColor: "#1e3a5f",
    borderRadius: 10, padding: 15,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  footer: {
    color: "#aaa", fontSize: 11,
    textAlign: "center", marginTop: 24,
  },
});