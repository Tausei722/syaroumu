import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  email: string;
  name: string;
  role: "sharoushi" | "company_admin" | "employee";
  company_id: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  setAuth: async (token, user) => {
    await AsyncStorage.setItem("access_token", token);
    set({ token, user });
  },

  logout: async () => {
    await AsyncStorage.removeItem("access_token");
    set({ token: null, user: null });
  },

  loadFromStorage: async () => {
    const token = await AsyncStorage.getItem("access_token");
    set({ token: token ?? null });
  },
}));