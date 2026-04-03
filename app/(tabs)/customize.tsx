import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useThemeStore,
  FONTS, FONT_SIZES, BG_COLORS, PRIMARY_COLORS,
} from "../../store/theme";
import { useAuthStore } from "../../store/auth";

export default function CustomizeScreen() {
  const theme = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const isSharoushi = user?.role === "sharoushi";

  const [userBgInput, setUserBgInput] = useState(theme.userBgImageUrl ?? "");
  const [companyBgInput, setCompanyBgInput] = useState(theme.bgImageUrl ?? "");

  const save = async (updates: Parameters<typeof theme.updateUserTheme>[0]) => {
    await theme.updateUserTheme(updates);
    Alert.alert("保存しました");
  };

  const saveCompany = async (updates: object) => {
    if (!user?.company_id) return;
    await theme.updateCompanyTheme(user.company_id, updates);
    Alert.alert("会社設定を保存しました");
  };

  const primary = theme.primaryColor;
  const bgColor = theme.effectiveBgColor();

  return (
    <ImageBackground
      source={theme.bgImageUrl ? { uri: theme.bgImageUrl } : undefined}
      style={[styles.container, { backgroundColor: bgColor }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* プレビュー */}
        <View style={[styles.previewCard, { borderColor: primary }]}>
          <Text style={[styles.previewTitle, { color: primary, fontFamily: theme.effectiveFontFamily() }]}>
            プレビュー
          </Text>
          <Text style={[styles.previewBody, {
            fontFamily: theme.effectiveFontFamily(),
            fontSize: 14 * theme.fontScale(),
          }]}>
            このようなフォントと背景でアプリが表示されます。労務ニュースや申請管理を快適に。
          </Text>
        </View>

        {/* ---- ユーザー個人設定 ---- */}
        <SectionHeader title="個人設定" icon="person-outline" />

        <SettingGroup label="フォント">
          {FONTS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.optionRow, theme.fontFamily === f.value && { backgroundColor: primary + "18" }]}
              onPress={() => save({ fontFamily: f.value })}
            >
              <Text style={[styles.optionLabel, { fontFamily: f.value === "System" ? undefined : f.value }]}>
                {f.label}
              </Text>
              {theme.fontFamily === f.value && <Ionicons name="checkmark-circle" size={20} color={primary} />}
            </TouchableOpacity>
          ))}
        </SettingGroup>

        <SettingGroup label="文字サイズ">
          <View style={styles.sizeRow}>
            {FONT_SIZES.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.sizeBtn, theme.fontSize === f.value && { backgroundColor: primary }]}
                onPress={() => save({ fontSize: f.value as any })}
              >
                <Text style={[styles.sizeBtnText, { fontSize: 12 * f.scale }, theme.fontSize === f.value && { color: "#fff" }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingGroup>

        <SettingGroup label="背景カラー（個人）">
          <View style={styles.colorGrid}>
            {BG_COLORS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c.value },
                  theme.userBgColor === c.value && styles.colorSwatchSelected,
                ]}
                onPress={() => save({ userBgColor: c.value })}
              >
                {theme.userBgColor === c.value && <Ionicons name="checkmark" size={18} color={c.value === "#1a1a2e" ? "#fff" : "#333"} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.colorSwatch, { backgroundColor: "#fff", borderStyle: "dashed" }]}
              onPress={() => save({ userBgColor: null })}
            >
              <Text style={{ fontSize: 10, color: "#999", textAlign: "center" }}>リセット</Text>
            </TouchableOpacity>
          </View>
        </SettingGroup>

        <SettingGroup label="背景画像URL（個人）">
          <TextInput
            style={styles.input}
            placeholder="https://..."
            value={userBgInput}
            onChangeText={setUserBgInput}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: primary }]}
            onPress={() => save({ userBgImageUrl: userBgInput || null })}
          >
            <Text style={styles.applyBtnText}>適用</Text>
          </TouchableOpacity>
        </SettingGroup>

        {/* ---- 会社設定（社労士のみ） ---- */}
        {isSharoushi && (
          <>
            <SectionHeader title="会社設定（社労士専用）" icon="business-outline" />

            <SettingGroup label="メインカラー">
              <View style={styles.colorGrid}>
                {PRIMARY_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c.value },
                      theme.primaryColor === c.value && styles.colorSwatchSelected,
                    ]}
                    onPress={() => saveCompany({ primary_color: c.value })}
                  >
                    {theme.primaryColor === c.value && <Ionicons name="checkmark" size={18} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </SettingGroup>

            <SettingGroup label="会社の背景カラー">
              <View style={styles.colorGrid}>
                {BG_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c.value },
                      theme.bgColor === c.value && styles.colorSwatchSelected,
                    ]}
                    onPress={() => saveCompany({ bg_color: c.value })}
                  >
                    {theme.bgColor === c.value && <Ionicons name="checkmark" size={18} color={c.value === "#1a1a2e" ? "#fff" : "#333"} />}
                  </TouchableOpacity>
                ))}
              </View>
            </SettingGroup>

            <SettingGroup label="会社の背景画像URL">
              <TextInput
                style={styles.input}
                placeholder="https://..."
                value={companyBgInput}
                onChangeText={setCompanyBgInput}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: primary }]}
                onPress={() => saveCompany({ bg_image_url: companyBgInput || null })}
              >
                <Text style={styles.applyBtnText}>全クライアントに適用</Text>
              </TouchableOpacity>
            </SettingGroup>
          </>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color="#666" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 4, paddingBottom: 40 },
  previewCard: {
    backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12,
    padding: 16, marginBottom: 20, borderWidth: 2,
  },
  previewTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  previewBody: { color: "#444", lineHeight: 22 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 20, marginBottom: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: "bold", color: "#666", textTransform: "uppercase", letterSpacing: 0.5 },
  group: {
    backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 12,
    padding: 14, marginBottom: 10,
  },
  groupLabel: { fontSize: 13, fontWeight: "600", color: "#888", marginBottom: 10 },
  optionRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4,
  },
  optionLabel: { fontSize: 15, color: "#333" },
  sizeRow: { flexDirection: "row", gap: 10 },
  sizeBtn: {
    flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 8,
    borderWidth: 1, borderColor: "#dde3ec",
  },
  sizeBtnText: { fontWeight: "600", color: "#555" },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorSwatch: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#dde3ec",
  },
  colorSwatchSelected: { borderWidth: 3, borderColor: "#333" },
  input: {
    borderWidth: 1, borderColor: "#dde3ec", borderRadius: 8,
    padding: 10, fontSize: 14, marginBottom: 8, backgroundColor: "#fafafa",
  },
  applyBtn: { borderRadius: 8, padding: 12, alignItems: "center" },
  applyBtnText: { color: "#fff", fontWeight: "bold" },
});
