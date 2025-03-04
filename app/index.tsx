import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Colors from "@/constants/Colors";

export default function RootIndex() {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading indicator while checking auth status
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  // Use Redirect component instead of router.replace
  return isSignedIn ? (
    <Redirect href="/(tabs)" />
  ) : (
    <Redirect href="/(onboarding)" />
  );
}
