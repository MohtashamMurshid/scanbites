import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
  RefreshControl,
} from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Link, router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import {
  doc,
  getDoc,
  collection,
  query,
  limit,
  getDocs,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@clerk/clerk-expo";

type ScanHistory = {
  id: string;
  foodName: string;
  calories: string;
  caloriesNum: number;
  protein: string;
  proteinNum: number;
  carbs: string;
  carbsNum: number;
  fat: string;
  fatNum: number;
  imageUrl: string;
  timestamp: Timestamp;
  scanDate: string;
};

type NutritionTip = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

type CalorieData = {
  day: string;
  calories: number;
  target: number;
  scanCount: number;
};

export default function HomeScreen() {
  const { userId } = useAuth();
  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<ScanHistory[]>([]);
  const [calorieData, setCalorieData] = useState<CalorieData[]>([]);
  const [calorieTarget, setCalorieTarget] = useState(2200); // Default target
  const [meanCalories, setMeanCalories] = useState(0);
  const [totalWeeklyCalories, setTotalWeeklyCalories] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Get short day name from date
  const getDayName = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  // Calculate calorie data for the past 7 days
  const calculateCalorieData = (scans: ScanHistory[]): CalorieData[] => {
    // Get the past 7 days
    const pastDays: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      pastDays.push(date.toISOString().split("T")[0]);
    }

    // Create a map of date to total calories
    const caloriesByDate: Record<string, number> = {};
    const scanCountByDate: Record<string, number> = {};

    pastDays.forEach((day) => {
      caloriesByDate[day] = 0;
      scanCountByDate[day] = 0;
    });

    // Sum calories for each day using numeric values only
    scans.forEach((scan) => {
      if (scan.scanDate && caloriesByDate[scan.scanDate] !== undefined) {
        // Use numeric value if available
        if (scan.caloriesNum && scan.caloriesNum > 0) {
          caloriesByDate[scan.scanDate] += scan.caloriesNum;
        }
        scanCountByDate[scan.scanDate] += 1;
      }
    });

    // Calculate total weekly calories and overall mean
    let weeklyTotal = 0;
    let totalScans = 0;
    let totalCalories = 0;

    pastDays.forEach((day) => {
      weeklyTotal += caloriesByDate[day];
      totalCalories += caloriesByDate[day];
      totalScans += scanCountByDate[day];
    });

    setTotalWeeklyCalories(weeklyTotal);

    // Set mean calories if there are any scans
    if (totalScans > 0) {
      setMeanCalories(Math.round(totalCalories / totalScans));
    }

    // Convert to CalorieData format
    return pastDays.map((day) => ({
      day: getDayName(day),
      calories: caloriesByDate[day],
      target: calorieTarget,
      scanCount: scanCountByDate[day],
    }));
  };

  // Fetch user data function to be used for initial load and refresh
  const fetchUserData = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get user data and preferences
      const userDoc = await getDoc(doc(db, "userPreferences", userId));
      if (userDoc.exists()) {
        setUserName("User"); // In a real app, you would store and retrieve the user's name
        // You could set calorie target from user preferences here if available
      }

      // Get recent food scans
      const scansQuery = query(
        collection(db, "nutritionData"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const scansSnapshot = await getDocs(scansQuery);
      const scansData: ScanHistory[] = [];

      scansSnapshot.forEach((doc) => {
        const data = doc.data();
        scansData.push({
          id: doc.id,
          foodName: data.foodName || "Unknown Food",
          calories: data.calories || "0 kcal",
          caloriesNum: data.caloriesNum || 0,
          protein: data.protein || "0g",
          proteinNum: data.proteinNum || 0,
          carbs: data.carbs || "0g",
          carbsNum: data.carbsNum || 0,
          fat: data.fat || "0g",
          fatNum: data.fatNum || 0,
          imageUrl: data.imageUrl || "",
          timestamp: data.timestamp,
          scanDate: data.scanDate || new Date().toISOString().split("T")[0],
        });
      });

      setRecentScans(scansData);

      // Calculate calorie data for chart
      const calculatedCalorieData = calculateCalorieData(scansData);
      setCalorieData(calculatedCalorieData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load data. Please try again later.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.messageText}>Loading your nutrition data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.light.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Welcome</Text>
          <Text style={styles.userName}>Let's track your nutrition today</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={onRefresh}>
          <Ionicons
            name="refresh-outline"
            size={24}
            color={Colors.light.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.light.primary]}
            tintColor={Colors.light.primary}
          />
        }
      >
        <TouchableOpacity
          style={styles.scanCard}
          onPress={() => router.push("/(tabs)/scan")}
        >
          <View style={styles.scanCardContent}>
            <View>
              <Text style={styles.scanCardTitle}>Scan Food Now</Text>
              <Text style={styles.scanCardDescription}>
                Analyze nutrition information with our AI scanner
              </Text>
            </View>
            <View style={styles.scanIconContainer}>
              <Ionicons
                name="scan-circle"
                size={64}
                color={Colors.light.background}
              />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity
              onPress={() => router.push("/(history)/food-history")}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentScans.length > 0 ? (
            recentScans.map((scan) => (
              <TouchableOpacity
                key={scan.id}
                style={styles.foodCard}
                onPress={() => {
                  router.push({
                    pathname: "/(details)/food-detail",
                    params: { id: scan.id },
                  });
                }}
              >
                <View style={styles.foodImageContainer}>
                  {scan.imageUrl ? (
                    <Image
                      source={{ uri: scan.imageUrl }}
                      style={styles.foodImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.foodImagePlaceholder}>
                      <Ionicons
                        name="restaurant"
                        size={28}
                        color={Colors.light.primary}
                      />
                    </View>
                  )}
                </View>
                <View style={styles.foodDetails}>
                  <Text style={styles.foodName}>{scan.foodName}</Text>
                  <View style={styles.nutritionInfo}>
                    <Text style={styles.nutritionText}>
                      {scan.caloriesNum
                        ? `${scan.caloriesNum} kcal`
                        : scan.calories}
                    </Text>
                    <Text style={styles.nutritionText}>
                      P:{" "}
                      {scan.proteinNum ? `${scan.proteinNum}g` : scan.protein}
                    </Text>
                    <Text style={styles.nutritionText}>
                      C: {scan.carbsNum ? `${scan.carbsNum}g` : scan.carbs}
                    </Text>
                    <Text style={styles.nutritionText}>
                      F: {scan.fatNum ? `${scan.fatNum}g` : scan.fat}
                    </Text>
                  </View>
                  <Text style={styles.scanTime}>
                    {scan.timestamp
                      ? new Date(scan.timestamp.toDate()).toLocaleString()
                      : "Recent"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <Ionicons
                name="restaurant-outline"
                size={40}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.emptyStateText}>
                No recent scans. Start scanning your food to track nutrition!
              </Text>
              <TouchableOpacity
                style={styles.scanNowButton}
                onPress={() => router.push("/(tabs)/scan")}
              >
                <Text style={styles.scanNowButtonText}>Scan Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Calorie Tracker</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calorieStatsContainer}>
            <View style={styles.calorieStatCard}>
              <Text style={styles.calorieStatValue}>{meanCalories}</Text>
              <Text style={styles.calorieStatLabel}>Mean Cal/Meal</Text>
            </View>
            <View style={styles.calorieStatCard}>
              <Text style={styles.calorieStatValue}>{totalWeeklyCalories}</Text>
              <Text style={styles.calorieStatLabel}>Weekly Cal</Text>
            </View>
            <View style={styles.calorieStatCard}>
              <Text style={styles.calorieStatValue}>
                {Math.round(totalWeeklyCalories / 7)}
              </Text>
              <Text style={styles.calorieStatLabel}>Daily Avg</Text>
            </View>
          </View>

          <View style={styles.calorieChartContainer}>
            <View style={styles.chartYAxis}>
              <Text style={styles.chartAxisLabel}>2500</Text>
              <Text style={styles.chartAxisLabel}>2000</Text>
              <Text style={styles.chartAxisLabel}>1500</Text>
              <Text style={styles.chartAxisLabel}>1000</Text>
              <Text style={styles.chartAxisLabel}>500</Text>
              <Text style={styles.chartAxisLabel}>0</Text>
            </View>

            <View style={styles.chartMainContainer}>
              <View style={styles.gridLinesContainer}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={styles.gridLine} />
                ))}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chartScrollContent}
              >
                <View style={styles.chartContent}>
                  {calorieData.map((data, index) => {
                    const barHeight = (data.calories / 2500) * 200;
                    const targetLinePosition = 200 - (data.target / 2500) * 200;

                    return (
                      <View key={index} style={styles.barContainer}>
                        <View style={styles.barLabelContainer}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: Math.max(barHeight, 1), // Ensure bar is at least 1px tall
                                backgroundColor:
                                  data.calories > data.target
                                    ? "#FF6B6B"
                                    : Colors.light.primary,
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.targetLine,
                              { bottom: targetLinePosition },
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabel}>{data.day}</Text>
                        <Text style={styles.calorieValue}>{data.calories}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>

          <View style={styles.calorieInfoContainer}>
            <View style={styles.calorieInfoItem}>
              <View
                style={[
                  styles.legendBox,
                  { backgroundColor: Colors.light.primary },
                ]}
              />
              <Text style={styles.legendText}>Under Target</Text>
            </View>
            <View style={styles.calorieInfoItem}>
              <View
                style={[styles.legendBox, { backgroundColor: "#FF6B6B" }]}
              />
              <Text style={styles.legendText}>Over Target</Text>
            </View>
            <View style={styles.calorieInfoItem}>
              <View
                style={[
                  styles.legendBox,
                  { backgroundColor: "#333", width: 20, height: 2 },
                ]}
              />
              <Text style={styles.legendText}>
                Target ({calorieTarget} cal)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  notificationButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  scanCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scanCardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.light.background,
    marginBottom: 8,
  },
  scanCardDescription: {
    fontSize: 14,
    color: Colors.light.background,
    opacity: 0.9,
    maxWidth: "80%",
    lineHeight: 20,
  },
  scanIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  foodCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: Colors.light.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  foodImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  foodImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  foodImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  foodDetails: {
    flex: 1,
    justifyContent: "center",
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 6,
  },
  nutritionInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  nutritionText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    backgroundColor: Colors.light.surface,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
  },
  emptyStateCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: Colors.light.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    color: Colors.light.textSecondary,
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 20,
  },
  scanNowButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  scanNowButtonText: {
    color: Colors.light.background,
    fontSize: 14,
    fontWeight: "600",
  },
  calorieChartContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartYAxis: {
    flexDirection: "column-reverse",
    justifyContent: "space-between",
    height: 200,
    paddingVertical: 8,
    marginRight: 8,
  },
  chartAxisLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  chartMainContainer: {
    flex: 1,
    position: "relative",
    height: 220,
  },
  gridLinesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 20,
    flexDirection: "column-reverse",
    justifyContent: "space-between",
  },
  gridLine: {
    width: "100%",
    height: 1,
    backgroundColor: Colors.light.border + "50", // semitransparent
  },
  chartScrollContent: {
    paddingHorizontal: 10,
  },
  chartContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    minWidth: "100%",
    height: 200,
    paddingBottom: 20,
  },
  barContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginHorizontal: 12,
    width: 40,
  },
  barLabelContainer: {
    position: "relative",
    alignItems: "center",
    width: "100%",
  },
  bar: {
    width: 30,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  targetLine: {
    position: "absolute",
    left: -5,
    height: 2,
    width: 40,
    backgroundColor: "#333",
  },
  barLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 8,
  },
  calorieValue: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  calorieInfoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  calorieInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.error,
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: Colors.light.background,
    fontSize: 14,
    fontWeight: "600",
  },
  scanTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  calorieStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  calorieStatCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: Colors.light.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  calorieStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  calorieStatLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});
