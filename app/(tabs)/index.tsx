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
import { Link, router, useLocalSearchParams, useRouter } from "expo-router";
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
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import CalorieProgressRing from "@/app/components/CalorieProgressRing";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { useAuth, useUser } from "@clerk/clerk-expo";

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
  isConsumed: boolean;
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

type WeeklyCalorieData = {
  weekStartDate: string;
  dailyData: {
    [date: string]: {
      calories: number;
      scanCount: number;
    };
  };
  totalCalories: number;
  meanCaloriesPerMeal: number;
};

type DietaryAlert = {
  id: string;
  type: "warning" | "info";
  message: string;
  icon: "warning-outline" | "nutrition-outline";
};

export default function HomeScreen() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  // Pull out only the two params we care about
  const params = useLocalSearchParams();
  const refresh = params.refresh as string | undefined;
  const calorieTargetParam = params.calorieTarget as string | undefined;

  const [userName, setUserName] = useState("User");
  const [recentScans, setRecentScans] = useState<ScanHistory[]>([]);
  const [calorieData, setCalorieData] = useState<CalorieData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(2000);
  const [weeklyCalorieTarget, setWeeklyCalorieTarget] = useState(14000);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [totalWeeklyCalories, setTotalWeeklyCalories] = useState(0);
  const [alerts, setAlerts] = useState<DietaryAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const { user } = useUser();
  const username = user?.emailAddresses[0].emailAddress.split("@")[0];

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
      if (
        scan.scanDate &&
        caloriesByDate[scan.scanDate] !== undefined &&
        scan.isConsumed === true &&
        typeof scan.caloriesNum === "number"
      ) {
        caloriesByDate[scan.scanDate] += scan.caloriesNum;
        scanCountByDate[scan.scanDate] += 1;
      }
    });

    // Calculate totals
    let weeklyTotal = 0;
    let totalScans = 0;
    let totalCalories = 0;

    pastDays.forEach((day) => {
      weeklyTotal += caloriesByDate[day];
      totalCalories += caloriesByDate[day];
      totalScans += scanCountByDate[day];
    });

    setTotalWeeklyCalories(weeklyTotal);

    if (totalScans > 0) {
      setDailyCalories(caloriesByDate[new Date().toISOString().split("T")[0]]);
    }

    // Save weekly data to Firestore
    if (userId) {
      const weekStartDate = pastDays[0];
      const weeklyData: WeeklyCalorieData = {
        weekStartDate,
        dailyData: {},
        totalCalories: weeklyTotal,
        meanCaloriesPerMeal:
          totalScans > 0 ? Math.round(totalCalories / totalScans) : 0,
      };

      // Add daily data
      pastDays.forEach((day) => {
        weeklyData.dailyData[day] = {
          calories: caloriesByDate[day],
          scanCount: scanCountByDate[day],
        };
      });

      // Save to Firestore
      setDoc(
        doc(db, "weekly-calories", `${userId}_${weekStartDate}`),
        {
          ...weeklyData,
          userId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((error) => {
        console.error("Error saving weekly calorie data:", error);
      });
    }

    return pastDays.map((day) => ({
      day: getDayName(day),
      calories: caloriesByDate[day],
      target: dailyCalorieTarget,
      scanCount: scanCountByDate[day],
    }));
  };

  // Update calorie target
  const updateCalorieTarget = async (newTarget: number) => {
    if (!userId) return;
    try {
      await setDoc(
        doc(db, "userPreferences", userId),
        {
          dailyCalorieTarget: newTarget,
          weeklyCalorieTarget: newTarget * 7,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setDailyCalorieTarget(newTarget);
      setWeeklyCalorieTarget(newTarget * 7);
    } catch (error) {
      console.error("Error updating calorie target:", error);
      Alert.alert(
        "Error",
        "Failed to update calorie target. Please try again."
      );
    }
  };

  // Get user preferences including calorie target
  const fetchUserPreferences = async () => {
    if (!userId) return;
    try {
      const userPrefsDoc = await getDoc(doc(db, "userPreferences", userId));
      if (userPrefsDoc.exists()) {
        const prefs = userPrefsDoc.data();
        setDailyCalorieTarget(prefs.dailyCalorieTarget || 2000);
        setWeeklyCalorieTarget(prefs.weeklyCalorieTarget || 14000);
      } else {
        // Create default preferences if they don't exist
        await setDoc(doc(db, "userPreferences", userId), {
          dailyCalorieTarget: 2000,
          weeklyCalorieTarget: 14000,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
    }
  };

  // Fetch user data function to be used for initial load and refresh
  const fetchUserData = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch user preferences first
      await fetchUserPreferences();

      // Get recent food scans with no limit to ensure we get all data for calculations
      const scansQuery = query(
        collection(db, "nutritionData"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      );

      const scansSnapshot = await getDocs(scansQuery);
      const scansData: ScanHistory[] = [];

      scansSnapshot.forEach((doc) => {
        const data = doc.data();
        // Ensure we're correctly handling the isConsumed field
        const isConsumed = data.isConsumed === true;
        const caloriesNum =
          typeof data.caloriesNum === "number" ? data.caloriesNum : 0;

        scansData.push({
          id: doc.id,
          foodName: data.foodName || "Unknown Food",
          calories: data.calories || "0 kcal",
          caloriesNum: caloriesNum,
          protein: data.protein || "0g",
          proteinNum: data.proteinNum || 0,
          carbs: data.carbs || "0g",
          carbsNum: data.carbsNum || 0,
          fat: data.fat || "0g",
          fatNum: data.fatNum || 0,
          imageUrl: data.imageUrl || "",
          timestamp: data.timestamp,
          scanDate: data.scanDate || new Date().toISOString().split("T")[0],
          isConsumed: isConsumed,
        });
      });

      // Sort scans by date for display
      const sortedScans = scansData.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return b.timestamp.toMillis() - a.timestamp.toMillis();
      });

      // Calculate today's total
      const today = new Date().toISOString().split("T")[0];
      const todayScans = scansData.filter(
        (scan) => scan.scanDate === today && scan.isConsumed === true
      );
      const todayTotal = todayScans.reduce(
        (sum, scan) => sum + (scan.caloriesNum || 0),
        0
      );

      // Update all states at once to ensure consistency
      setRecentScans(sortedScans.slice(0, 10));
      setDailyCalories(todayTotal);
      setCalorieData(calculateCalorieData(scansData));
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load data. Please try again later.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (userId && isLoaded) {
      fetchUserData();
    }
  }, [userId, isLoaded]);

  // -------- FIXED useEffect: only depend on refresh & calorieTargetParam --------
  useEffect(() => {
    if (refresh) {
      fetchUserData();
    }

    if (calorieTargetParam) {
      const newTarget = parseInt(calorieTargetParam);
      if (!isNaN(newTarget)) {
        updateCalorieTarget(newTarget);
      }
    }
  }, [refresh, calorieTargetParam]);
  // -------------------------------------------------------------------------------

  // Add an interval refresh every minute to keep data current
  useEffect(() => {
    if (userId) {
      const interval = setInterval(() => {
        fetchUserData();
      }, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Update the alerts creation
  useEffect(() => {
    if (userId) {
      const newAlerts: DietaryAlert[] = [];

      if (dailyCalories > dailyCalorieTarget) {
        newAlerts.push({
          id: "calories",
          type: "warning",
          message: "You have exceeded your daily calorie target",
          icon: "warning-outline",
        });
      }

      const proteinTarget = (dailyCalorieTarget * 0.2) / 4;
      const currentProtein = recentScans
        .filter(
          (scan) =>
            scan.isConsumed &&
            scan.scanDate === new Date().toISOString().split("T")[0]
        )
        .reduce((sum, scan) => sum + (scan.proteinNum || 0), 0);

      if (currentProtein < proteinTarget * 0.7) {
        newAlerts.push({
          id: "protein",
          type: "info",
          message: "Your protein intake is below recommended levels",
          icon: "nutrition-outline",
        });
      }

      setAlerts(newAlerts);
    }
  }, [dailyCalories, dailyCalorieTarget, recentScans]);

  const handleSetTarget = () => {
    router.push("/calorie-target");
  };

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
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <Text style={styles.userName}>{username}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setShowAlerts(!showAlerts)}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={Colors.light.primary}
            />
            {alerts.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {alerts.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchUserData}
          >
            <Ionicons
              name="refresh-outline"
              size={24}
              color={Colors.light.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {showAlerts && alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          {alerts.map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <Ionicons
                name={alert.icon}
                size={24}
                color={
                  alert.type === "warning"
                    ? Colors.light.error
                    : Colors.light.primary
                }
              />
              <Text style={styles.alertText}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchUserData}
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
            <Text style={styles.sectionTitle}>Calorie Tracker</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleSetTarget}>
                <View style={styles.targetButton}>
                  <Ionicons
                    name="settings-outline"
                    size={20}
                    color={Colors.light.primary}
                  />
                  <Text style={styles.targetButtonText}>Set Target</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => router.push("/(details)/nutrition-overview")}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressCard}>
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Ionicons
                    name="today-outline"
                    size={24}
                    color={Colors.light.primary}
                  />
                  <Text style={styles.progressTitle}>Today's Calories</Text>
                </View>
                <AnimatedCircularProgress
                  size={160}
                  width={12}
                  fill={(dailyCalories / dailyCalorieTarget) * 100}
                  tintColor={Colors.light.primary}
                  backgroundColor={Colors.light.surface}
                  rotation={0}
                  lineCap="round"
                >
                  {(fill) => (
                    <View style={styles.progressTextContainer}>
                      <Text style={styles.progressValue}>
                        {Math.round(dailyCalories)}
                      </Text>
                      <Text style={styles.progressTarget}>
                        of {dailyCalorieTarget}
                      </Text>
                      <Text
                        style={[
                          styles.progressPercentage,
                          {
                            color:
                              fill > 100
                                ? Colors.light.error
                                : Colors.light.primary,
                          },
                        ]}
                      >
                        {Math.round(fill)}%
                      </Text>
                    </View>
                  )}
                </AnimatedCircularProgress>
              </View>

              <View style={styles.divider} />

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={Colors.light.secondary}
                  />
                  <Text
                    style={[
                      styles.progressTitle,
                      { color: Colors.light.secondary },
                    ]}
                  >
                    Weekly Calories
                  </Text>
                </View>
                <AnimatedCircularProgress
                  size={160}
                  width={12}
                  fill={(totalWeeklyCalories / weeklyCalorieTarget) * 100}
                  tintColor={Colors.light.secondary}
                  backgroundColor={Colors.light.surface}
                  rotation={0}
                  lineCap="round"
                >
                  {(fill) => (
                    <View style={styles.progressTextContainer}>
                      <Text
                        style={[
                          styles.progressValue,
                          { color: Colors.light.secondary },
                        ]}
                      >
                        {Math.round(totalWeeklyCalories)}
                      </Text>
                      <Text style={styles.progressTarget}>
                        of {weeklyCalorieTarget}
                      </Text>
                      <Text
                        style={[
                          styles.progressPercentage,
                          {
                            color:
                              fill > 100
                                ? Colors.light.error
                                : Colors.light.secondary,
                          },
                        ]}
                      >
                        {Math.round(fill)}%
                      </Text>
                    </View>
                  )}
                </AnimatedCircularProgress>
              </View>
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationButton: {
    padding: 4,
    marginRight: 8,
    position: "relative",
  },
  refreshButton: {
    padding: 4,
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.light.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  alertsContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: Colors.light.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  alertText: {
    marginLeft: 12,
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  seeAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
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
  calorieStatProgress: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  targetButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  targetButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  progressContainer: {
    paddingVertical: 16,
  },
  progressCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.light.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  progressSection: {
    alignItems: "center",
    paddingVertical: 16,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.primary,
    marginLeft: 8,
  },
  progressTextContainer: {
    alignItems: "center",
  },
  progressValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  progressTarget: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 8,
    opacity: 0.5,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
});
