import { useEffect } from "react";
import { Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "../store/auth";
import { usePushNotification } from "../hooks/usePushNotification";

export default function RootLayout() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const hydrated = useAuthStore((s) => s.hydrated);
  usePushNotification();

  useEffect(() => {
    loadFromStorage();
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1e3a5f" }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
