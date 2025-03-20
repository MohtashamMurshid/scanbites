import { Stack } from "expo-router";
import Colors from "@/constants/Colors";

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
        contentStyle: { backgroundColor: Colors.light.background },
        animation: "slide_from_bottom",
      }}
    />
  );
}
