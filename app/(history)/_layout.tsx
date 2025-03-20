import { Stack } from "expo-router";
import { View } from "react-native";
import Colors from "@/constants/Colors";

export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.light.primary,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        contentStyle: {
          backgroundColor: Colors.light.background,
        },
        headerTitleAlign: "center",
        headerBackVisible: true,
        headerLargeTitle: false,
      }}
    />
  );
}
