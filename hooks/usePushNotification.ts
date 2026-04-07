import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { registerPushToken } from "../services/api";

export function usePushNotification() {
  useEffect(() => {
    // setNotificationHandler を含め、全処理を useEffect 内で実行する
    // （モジュールレベルで呼ぶと TestFlight でクラッシュするため）
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    setupPushNotifications();
  }, []);
}

async function setupPushNotifications() {
  try {
    if (!Device.isDevice) return;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    await registerPushToken(token);
  } catch {
    // プッシュ通知の失敗はアプリに影響させない
  }
}