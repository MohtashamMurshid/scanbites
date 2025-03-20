import { Stack } from "expo-router";
import Colors from "@/constants/Colors";

export default function DetailsLayout() {
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
