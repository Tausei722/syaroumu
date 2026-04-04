import { useEffect } from "react";
import { Stack } from "expo-router";
import { useAuthStore } from "../store/auth";

export default function RootLayout() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}