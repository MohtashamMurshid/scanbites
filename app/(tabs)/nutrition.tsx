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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import Svg, { Circle } from "react-native-svg";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useRecentScans, useConsumedScans } from "@/hooks/useQueries";

type Article = {
  id: string;
  title: string;
  description: string;
  image: any;
};

const CircleProgress = ({
  size,
  strokeWidth,
  progress,
  label,
  value,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  label: string;
  value: string | number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.progressContainer}>
      <Svg width={size} height={size}>
        <Circle
          stroke="#E8E8E8"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={Colors.light.primary}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.progressContent}>
        <Text style={styles.progressValue}>{value}</Text>
        <Text style={styles.progressLabel}>{label}</Text>
      </View>
    </View>
  );
};

export default function NutritionScreen() {
  const { userId } = useAuth();
  const { user } = useUser();

  // Use TanStack Query hooks
  const { data: recentScans = [], isLoading: isLoadingRecent } =
    useRecentScans(5);
  const { data: consumedScans = [], isLoading: isLoadingConsumed } =
    useConsumedScans();

  // Calculate nutrition stats
  const nutritionStats = React.useMemo(() => {
    if (!consumedScans.length) {
      return {
        totalCalories: 0,
        averageCalories: 0,
        scansCount: 0,
      };
    }

    const totalCals = consumedScans.reduce(
      (sum, scan) => sum + (scan.caloriesNum || 0),
      0
    );

    return {
      totalCalories: totalCals,
      averageCalories: Math.round(totalCals / consumedScans.length),
      scansCount: consumedScans.length,
    };
  }, [consumedScans]);

  if (isLoadingRecent || isLoadingConsumed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading your nutrition data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.firstName || "there"}! 👋
          </Text>
          <Text style={styles.subtitle}>Here's your nutrition overview</Text>
        </View>

        <View style={styles.statsContainer}>
          <CircleProgress
            size={120}
            strokeWidth={12}
            progress={Math.min(
              (nutritionStats.averageCalories / 2000) * 100,
              100
            )}
            label="Daily Calories"
            value={nutritionStats.averageCalories}
          />
          <CircleProgress
            size={120}
            strokeWidth={12}
            progress={Math.min((nutritionStats.scansCount / 10) * 100, 100)}
            label="Total Scans"
            value={nutritionStats.scansCount}
          />
          <CircleProgress
            size={120}
            strokeWidth={12}
            progress={Math.min(
              (nutritionStats.totalCalories / 10000) * 100,
              100
            )}
            label="Total Calories"
            value={nutritionStats.totalCalories}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity
              onPress={() => router.push("/(history)/food-history")}
            >
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScansContainer}
          >
            {recentScans.map((scan) => (
              <TouchableOpacity
                key={scan.id}
                style={styles.scanCard}
                onPress={() =>
                  router.push({
                    pathname: "/(details)/food-detail",
                    params: { id: scan.id },
                  })
                }
              >
                {scan.imageUrl ? (
                  <Image
                    source={{ uri: scan.imageUrl }}
                    style={styles.foodImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons
                      name="restaurant-outline"
                      size={24}
                      color={Colors.light.primary}
                    />
                  </View>
                )}
                <View style={styles.scanInfo}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {scan.foodName}
                  </Text>
                  <Text style={styles.calories}>{scan.calories}</Text>
                  {scan.isConsumed && (
                    <View style={styles.consumedBadge}>
                      <Text style={styles.consumedText}>Consumed</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.addScanCard}
              onPress={() => router.push("/(tabs)/scan")}
            >
              <Ionicons
                name="add-circle-outline"
                size={32}
                color={Colors.light.primary}
              />
              <Text style={styles.addScanText}>Scan Food</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons
              name="bulb-outline"
              size={24}
              color={Colors.light.primary}
            />
            <Text style={styles.tipText}>
              Track your meals regularly to maintain a balanced diet and achieve
              your health goals.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  header: {
    padding: 16,
    backgroundColor: "white",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 24,
    marginBottom: 16,
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressContent: {
    position: "absolute",
    alignItems: "center",
  },
  progressValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: "white",
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  seeAllButton: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  recentScansContainer: {
    paddingBottom: 8,
  },
  scanCard: {
    width: 160,
    backgroundColor: "white",
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  foodImage: {
    width: "100%",
    height: 120,
  },
  placeholderImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  scanInfo: {
    padding: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  calories: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  consumedBadge: {
    backgroundColor: Colors.light.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  consumedText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  addScanCard: {
    width: 160,
    height: 200,
    backgroundColor: Colors.light.primary + "10",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addScanText: {
    marginTop: 8,
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.primary + "10",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
});
