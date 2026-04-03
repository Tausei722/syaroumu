/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/login` | `/(tabs)` | `/(tabs)/calendar` | `/(tabs)/customize` | `/(tabs)/leave` | `/(tabs)/settings` | `/(tabs)/timeline` | `/_sitemap` | `/calendar` | `/customize` | `/leave` | `/login` | `/settings` | `/timeline`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
