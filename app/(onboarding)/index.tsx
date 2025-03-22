import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
  Animated,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ListRenderItem,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { Redirect, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import { useAuth } from "@clerk/clerk-expo";

const { width, height } = Dimensions.get("window");
const FOOTER_HEIGHT = 120; // Approximate height of the footer
const STATUSBAR_HEIGHT =
  Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 0;

type OnboardingItem = {
  id: string;
  title: string;
  description: string;
  image: any;
};

const onboardingData: OnboardingItem[] = [
  {
    id: "1",
    title: "Welcome to ScanBites",
    description:
      "Your AI-powered food scanner for personalized nutrition guidance.",
    image: require("@/assets/images/onboarding-01.png"),
  },
  {
    id: "2",
    title: "Scan Any Food",
    description:
      "Point your camera at any food item and get instant nutritional information powered by AI.",
    image: require("@/assets/images/onboarding-02..png"),
  },
  {
    id: "3",
    title: "Personalized Guidance",
    description:
      "Receive nutrition recommendations tailored to your dietary needs and health goals.",
    image: require("@/assets/images/onboarding-03.png"),
  },
];

export default function OnboardingScreen() {
  const { isSignedIn } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const viewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) {
        setCurrentIndex(Number(viewableItems[0].index));
      }
    }
  ).current;
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // Redirect signed-in users to tabs
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const scrollTo = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index });
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    scrollX.setValue(scrollPosition);
  };

  const renderItem: ListRenderItem<OnboardingItem> = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [100, 0, 100],
    });

    return (
      <View style={styles.slide}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <Image source={item.image} style={styles.image} />
          <ThemedText style={styles.title}>{item.title}</ThemedText>
          <ThemedText style={styles.description}>{item.description}</ThemedText>
        </Animated.View>
      </View>
    );
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      scrollTo(currentIndex + 1);
    } else {
      router.push("/(auth)/sign-in");
    }
  };

  const handleSkip = () => {
    router.push("/(auth)/sign-in");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={["transparent", Colors.light.primary + "20"]}
          style={styles.gradient}
        />

        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={handleScroll}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          scrollEventThrottle={16}
          contentContainerStyle={styles.flatListContent}
        />

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {onboardingData.map((_, index) => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.8, 1.2, 0.8],
                extrapolate: "clamp",
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.4, 1, 0.4],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      transform: [{ scale }],
                      opacity,
                      backgroundColor: Colors.light.primary,
                    },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.buttons}>
            <ThemedText
              onPress={handleSkip}
              style={[styles.button, styles.skipButton]}
            >
              Skip
            </ThemedText>
            <ThemedView
              onTouchEnd={handleNext}
              style={[styles.button, styles.nextButton]}
            >
              <ThemedText style={styles.nextButtonText}>
                {currentIndex === onboardingData.length - 1
                  ? "Get Started"
                  : "Next"}
              </ThemedText>
            </ThemedView>
          </View>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.6,
    zIndex: -1,
  },
  flatListContent: {
    flexGrow: 1,
  },
  slide: {
    width,
    height: height - FOOTER_HEIGHT - STATUSBAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: FOOTER_HEIGHT / 2,
  },
  content: {
    alignItems: "center",
    padding: 20,
    maxHeight: height - FOOTER_HEIGHT - STATUSBAR_HEIGHT - 40,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: Colors.light.text,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 32,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 48,
    backgroundColor: Colors.light.background + "E6",
    height: FOOTER_HEIGHT,
    zIndex: 10,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButton: {
    color: Colors.light.textSecondary,
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 24,
    shadowColor: Colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  nextButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: "600",
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 30,
    resizeMode: "contain",
  },
});
