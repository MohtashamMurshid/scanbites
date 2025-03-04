import React, { useState } from "react";
import { useWindowDimensions, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";

const onboardingSteps = [
  {
    title: "Welcome to ScanBites",
    description:
      "Your smart companion for discovering and managing food information.",
  },
  {
    title: "Scan & Learn",
    description:
      "Simply scan food items to get detailed nutritional information and ingredients.",
  },
  {
    title: "Track & Monitor",
    description:
      "Keep track of your food habits and make informed decisions about your diet.",
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to business registration when onboarding is complete
      router.push("/business-registration");
    }
  };

  // ... rest of the code stays the same ...
}
