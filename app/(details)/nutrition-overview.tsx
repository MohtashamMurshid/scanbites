import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { useAuth } from "@clerk/clerk-expo";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";

interface DailyNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionByDate {
  [date: string]: DailyNutrition;
}

export default function NutritionOverviewScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const screenWidth = Dimensions.get("window").width;
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0],
        color: () => Colors.light.primary,
        strokeWidth: 2,
      },
    ],
  });
  const [nutritionStats, setNutritionStats] = useState({
    calories: { current: 0, target: 2500 },
    protein: { current: 0, target: 100 },
    carbs: { current: 0, target: 300 },
    fat: { current: 0, target: 80 },
  });

  useEffect(() => {
    const fetchNutritionData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);

        // Get the date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const nutritionQuery = query(
          collection(db, "nutritionData"),
          where("userId", "==", userId),
          where("timestamp", ">=", Timestamp.fromDate(sevenDaysAgo)),
          where("isConsumed", "==", true),
          orderBy("timestamp", "asc")
        );

        const snapshot = await getDocs(nutritionQuery);
        const nutritionByDate: NutritionByDate = {};

        // Initialize the last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          nutritionByDate[dateStr] = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          };
        }

        // Aggregate nutrition data by date
        snapshot.forEach((doc) => {
          const data = doc.data();
          const scanDate =
            data.scanDate ||
            new Date(data.timestamp.toDate()).toISOString().split("T")[0];

          if (nutritionByDate[scanDate]) {
            nutritionByDate[scanDate].calories += Number(data.caloriesNum) || 0;
            nutritionByDate[scanDate].protein += Number(data.proteinNum) || 0;
            nutritionByDate[scanDate].carbs += Number(data.carbsNum) || 0;
            nutritionByDate[scanDate].fat += Number(data.fatNum) || 0;
          }
        });

        // Prepare data for the chart
        const dates = Object.keys(nutritionByDate).sort();
        const labels = dates.map((date) =>
          new Date(date).toLocaleDateString("en-US", { weekday: "short" })
        );
        const calorieData = dates.map((date) => nutritionByDate[date].calories);

        setWeeklyData({
          labels,
          datasets: [
            {
              data: calorieData,
              color: () => Colors.light.primary,
              strokeWidth: 2,
            },
          ],
        });

        // Calculate today's nutrition stats
        const today = new Date().toISOString().split("T")[0];
        const todayStats = nutritionByDate[today] || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };

        setNutritionStats({
          calories: { current: todayStats.calories, target: 2500 },
          protein: { current: todayStats.protein, target: 100 },
          carbs: { current: todayStats.carbs, target: 300 },
          fat: { current: todayStats.fat, target: 80 },
        });
      } catch (error) {
        console.error("Error fetching nutrition data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNutritionData();
  }, [userId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading nutrition data...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Nutrition Overview",
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 8 }}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={Colors.light.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {/* Weekly Trend Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Calorie Trend</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={weeklyData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: Colors.light.background,
                backgroundGradientFrom: Colors.light.background,
                backgroundGradientTo: Colors.light.background,
                decimalPlaces: 0,
                color: (opacity = 1) => Colors.light.primary,
                style: {
                  borderRadius: 16,
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        </View>

        {/* Nutrition Progress Rings */}
        <View style={styles.progressGrid}>
          {Object.entries(nutritionStats).map(
            ([nutrient, { current, target }]) => (
              <View key={nutrient} style={styles.progressItem}>
                <Text style={styles.nutrientTitle}>
                  {nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}
                </Text>
                <AnimatedCircularProgress
                  size={100}
                  width={10}
                  fill={(current / target) * 100}
                  tintColor={
                    nutrient === "calories"
                      ? Colors.light.primary
                      : nutrient === "protein"
                      ? "#4CAF50"
                      : nutrient === "carbs"
                      ? "#2196F3"
                      : "#FF9800"
                  }
                  backgroundColor={Colors.light.surface}
                  rotation={0}
                  lineCap="round"
                >
                  {(fill) => (
                    <View style={styles.progressTextContainer}>
                      <Text style={styles.progressValue}>{current}</Text>
                      <Text style={styles.progressTarget}>/{target}</Text>
                    </View>
                  )}
                </AnimatedCircularProgress>
              </View>
            )
          )}
        </View>

        {/* Detailed Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons
                name="trending-up"
                size={24}
                color={Colors.light.primary}
              />
              <Text style={styles.statValue}>2,100</Text>
              <Text style={styles.statLabel}>Avg. Daily Calories</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="nutrition" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>75g</Text>
              <Text style={styles.statLabel}>Avg. Daily Protein</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  section: {
    padding: 20,
    backgroundColor: Colors.light.background,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 8,
    shadowColor: Colors.light.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    justifyContent: "space-between",
    backgroundColor: Colors.light.background,
    marginBottom: 12,
  },
  progressItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 16,
    shadowColor: Colors.light.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nutrientTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
  },
  progressTextContainer: {
    alignItems: "center",
    flexDirection: "row",
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  progressTarget: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
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
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.primary,
    marginTop: 20,
  },
});
