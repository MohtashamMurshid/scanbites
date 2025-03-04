import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

export default function OnboardingLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: {
            backgroundColor: "#FFFFFF",
          },
          header: () => null,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            header: () => null,
          }}
        />
        <Stack.Screen
          name="business-registration"
          options={{
            headerShown: false,
            header: () => null,
          }}
        />
      </Stack>
    </>
  );
}
