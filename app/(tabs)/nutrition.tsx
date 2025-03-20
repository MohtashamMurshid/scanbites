import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import Svg, { Circle } from "react-native-svg";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";

type Article = {
  id: string;
  title: string;
  description: string;
  image: any;
};

export default function NutritionScreen() {
  const { user } = useUser();

  // Mock data for the progress indicators
  const caloriesProgress = 0.35; // 35% progress
  const allergiesProgress = 0.7; // 70% progress
  const healthWarningsProgress = 0.2; // 20% progress

  // Mock data for the articles
  const articles: Article[] = [
    {
      id: "1",
      title: "Benefits of Eating Whole Foods",
      description:
        "Eating whole foods provides essential nutrients for overall health.",
      image: require("../../assets/images/onboarding-01.png"),
    },
    {
      id: "2",
      title: "Healthy Snack Options",
      description: "Opt for fruits, nuts, or yogurt for guilt-free snacking.",
      image: require("../../assets/images/onboarding-02..png"),
    },
    {
      id: "3",
      title: "Benefits of Eating Whole Foods",
      description:
        "Eating whole foods provides essential nutrients for overall health.",
      image: require("../../assets/images/onboarding-03.png"),
    },
    {
      id: "4",
      title: "Healthy Snack Options",
      description: "Opt for fruits, nuts, or yogurt for guilt-free snacking.",
      image: require("../../assets/images/onboarding-01.png"),
    },
  ];

  // Circle Progress component
  const CircleProgress = ({
    progress,
    color,
    title,
    size = 80,
    strokeWidth = 8,
  }: {
    progress: number;
    color: string;
    title: string;
    size?: number;
    strokeWidth?: number;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference * (1 - progress);

    return (
      <View style={styles.progressContainer}>
        <Svg width={size} height={size}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90, ${size / 2}, ${size / 2})`}
          />
        </Svg>
        <Text style={styles.progressTitle}>{title}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/(modals)/edit-profile")}
          >
            <Ionicons name="person-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Progress Metrics */}
        <View style={styles.progressSection}>
          <CircleProgress
            progress={caloriesProgress}
            color="#FF7A59"
            title="Calories"
          />
          <CircleProgress
            progress={allergiesProgress}
            color="#6FCF97"
            title="Allergies"
          />
          <CircleProgress
            progress={healthWarningsProgress}
            color="#333333"
            title="Health Warnings"
          />
        </View>

        {/* Healthier Meal Options Section */}
        <View style={styles.mealSection}>
          <Text style={styles.sectionTitle}>Healthier meal options</Text>

          {articles.map((article) => (
            <TouchableOpacity key={article.id} style={styles.articleCard}>
              <Image source={article.image} style={styles.articleImage} />
              <View style={styles.articleContent}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleDescription}>
                  {article.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Scan Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => router.push("/(tabs)/scan")}
        >
          <Ionicons name="scan-outline" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  progressSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressTitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  mealSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  articleCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  articleImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  articleContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  articleDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 20, // Position it above the tab bar
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
