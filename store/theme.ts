import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

export const FONTS = [
  { label: "システムフォント", value: "System" },
  { label: "丸ゴシック", value: "HiraMaruProN-W4" },
  { label: "明朝体", value: "HiraMinProN-W3" },
  { label: "ゴシック", value: "HiraKakuProN-W3" },
  { label: "太字ゴシック", value: "HiraKakuProN-W6" },
];

export const FONT_SIZES = [
  { label: "小", value: "small", scale: 0.9 },
  { label: "中", value: "medium", scale: 1.0 },
  { label: "大", value: "large", scale: 1.15 },
];

export const BG_COLORS = [
  { label: "ホワイト", value: "#f5f7fa" },
  { label: "クリーム", value: "#fdf6e3" },
  { label: "ライトブルー", value: "#eaf4fb" },
  { label: "ライトグリーン", value: "#eafaf1" },
  { label: "ダーク", value: "#1a1a2e" },
];

export const PRIMARY_COLORS = [
  { label: "ネイビー", value: "#1e3a5f" },
  { label: "グリーン", value: "#1a6b4a" },
  { label: "パープル", value: "#4a1a6b" },
  { label: "レッド", value: "#6b1a1a" },
  { label: "オレンジ", value: "#8b4513" },
];

interface ThemeState {
  // 会社テーマ
  primaryColor: string;
  bgColor: string;
  bgImageUrl: string | null;
  logoUrl: string | null;
  companyFontFamily: string;

  // ユーザー個人設定
  fontFamily: string;
  fontSize: "small" | "medium" | "large";
  userBgColor: string | null;
  userBgImageUrl: string | null;

  loadCompanyTheme: (companyId: string) => Promise<void>;
  loadUserTheme: () => Promise<void>;
  updateUserTheme: (updates: Partial<Pick<ThemeState, "fontFamily" | "fontSize" | "userBgColor" | "userBgImageUrl">>) => Promise<void>;
  updateCompanyTheme: (companyId: string, updates: object) => Promise<void>;

  // 計算済みプロパティ
  effectiveBgColor: () => string;
  effectiveFontFamily: () => string;
  fontScale: () => number;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  primaryColor: "#1e3a5f",
  bgColor: "#f5f7fa",
  bgImageUrl: null,
  logoUrl: null,
  companyFontFamily: "System",
  fontFamily: "System",
  fontSize: "medium",
  userBgColor: null,
  userBgImageUrl: null,

  loadCompanyTheme: async (companyId: string) => {
    try {
      const { data } = await api.get(`/customization/company/${companyId}`);
      set({
        primaryColor: data.primary_color,
        bgColor: data.bg_color,
        bgImageUrl: data.bg_image_url,
        logoUrl: data.logo_url,
        companyFontFamily: data.font_family,
      });
    } catch {}
  },

  loadUserTheme: async () => {
    try {
      const cached = await AsyncStorage.getItem("user_theme");
      if (cached) set(JSON.parse(cached));
      const { data } = await api.get("/customization/user/me");
      const updates = {
        fontFamily: data.font_family,
        fontSize: data.font_size,
        userBgColor: data.bg_color,
        userBgImageUrl: data.bg_image_url,
      };
      set(updates);
      await AsyncStorage.setItem("user_theme", JSON.stringify(updates));
    } catch {}
  },

  updateUserTheme: async (updates) => {
    set(updates);
    await AsyncStorage.setItem("user_theme", JSON.stringify({ ...get(), ...updates }));
    try {
      await api.put("/customization/user/me", {
        font_family: updates.fontFamily ?? get().fontFamily,
        font_size: updates.fontSize ?? get().fontSize,
        bg_color: updates.userBgColor ?? get().userBgColor,
        bg_image_url: updates.userBgImageUrl ?? get().userBgImageUrl,
      });
    } catch {}
  },

  updateCompanyTheme: async (companyId, updates) => {
    const { data } = await api.put(`/customization/company/${companyId}`, updates);
    set({
      primaryColor: data.primary_color,
      bgColor: data.bg_color,
      bgImageUrl: data.bg_image_url,
      logoUrl: data.logo_url,
    });
  },

  effectiveBgColor: () => {
    const s = get();
    return s.userBgColor ?? s.bgColor;
  },

  effectiveFontFamily: () => {
    const s = get();
    if (s.fontFamily !== "System") return s.fontFamily;
    if (s.companyFontFamily !== "System") return s.companyFontFamily;
    return undefined as any;
  },

  fontScale: () => {
    const s = get();
    return FONT_SIZES.find((f) => f.value === s.fontSize)?.scale ?? 1.0;
  },
}));
