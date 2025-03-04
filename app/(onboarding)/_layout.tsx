import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

export default function OnboardingLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: {
            backgroundColor: "transparent",
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="business-registration"
          options={{
            headerShown: true,
            headerTitle: "Business Registration",
            presentation: "modal",
          }}
        />
      </Stack>
    </>
  );
}
