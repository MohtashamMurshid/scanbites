import React, { useEffect, useState } from "react";
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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import Svg, { Circle } from "react-native-svg";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useRecentScans, useConsumedScans } from "@/hooks/useQueries";
import * as Location from "expo-location";

type Article = {
  id: string;
  title: string;
  description: string;
  image: any;
};

type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  distance: string;
  image?: string;
  vicinity: string;
  place_id: string;
};

type MealSuggestion = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
  tags: string[];
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
  const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>([]);
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestion[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [dailyTargets] = useState({
    calories: 2500,
    protein: 100,
    carbs: 300,
    fat: 80,
  });

  // Use TanStack Query hooks
  const { data: recentScans = [], isLoading: isLoadingRecent } =
    useRecentScans(5);
  const { data: consumedScans = [], isLoading: isLoadingConsumed } =
    useConsumedScans();

  // Calculate nutrition stats with more detailed metrics
  const nutritionStats = React.useMemo(() => {
    if (!consumedScans.length) {
      return {
        totalCalories: 0,
        averageCalories: 0,
        todayCalories: 0,
        todayProtein: 0,
        todayCarbs: 0,
        todayFat: 0,
        scansCount: 0,
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const todayScans = consumedScans.filter((scan) => {
      const scanDate =
        scan.scanDate ||
        new Date(scan.timestamp.toDate()).toISOString().split("T")[0];
      return scanDate === today;
    });

    const totalCals = consumedScans.reduce(
      (sum, scan) => sum + (scan.caloriesNum || 0),
      0
    );
    const todayStats = todayScans.reduce(
      (stats, scan) => ({
        calories: stats.calories + (scan.caloriesNum || 0),
        protein: stats.protein + (scan.proteinNum || 0),
        carbs: stats.carbs + (scan.carbsNum || 0),
        fat: stats.fat + (scan.fatNum || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      totalCalories: totalCals,
      averageCalories: Math.round(totalCals / consumedScans.length),
      todayCalories: todayStats.calories,
      todayProtein: todayStats.protein,
      todayCarbs: todayStats.carbs,
      todayFat: todayStats.fat,
      scansCount: consumedScans.length,
    };
  }, [consumedScans]);

  // Get user's location and fetch nearby restaurants
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Please enable location services to find nearby restaurants."
          );
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        // Replace 'YOUR_API_KEY' with your actual Google Places API key
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
        const radius = 1500; // Search within 1.5km
        const type = "restaurant";
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.coords.latitude},${location.coords.longitude}&radius=${radius}&type=${type}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK") {
          const restaurants: Restaurant[] = data.results.map((place: any) => ({
            id: place.place_id,
            name: place.name,
            cuisine: place.types[0].replace("_", " "),
            rating: place.rating || 0,
            distance: `${(
              getDistance(
                {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                },
                {
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                }
              ) / 1000
            ).toFixed(1)} km`,
            image: place.photos
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
              : undefined,
            vicinity: place.vicinity,
            place_id: place.place_id,
          }));

          setNearbyRestaurants(restaurants);
        } else {
          console.error("Failed to fetch restaurants:", data.status);
          Alert.alert("Error", "Failed to fetch nearby restaurants");
        }
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        Alert.alert("Error", "Failed to fetch nearby restaurants");
      }
    })();
  }, []);

  // Helper function to calculate distance between two coordinates
  function getDistance(
    coords1: { latitude: number; longitude: number },
    coords2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coords1.latitude * Math.PI) / 180;
    const φ2 = (coords2.latitude * Math.PI) / 180;
    const Δφ = ((coords2.latitude - coords1.latitude) * Math.PI) / 180;
    const Δλ = ((coords2.longitude - coords1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Generate meal suggestions based on remaining daily targets
  useEffect(() => {
    if (consumedScans.length > 0) {
      const remainingCalories =
        dailyTargets.calories - nutritionStats.todayCalories;
      const remainingProtein =
        dailyTargets.protein - nutritionStats.todayProtein;

      // Update meal suggestions based on remaining nutrients
      setMealSuggestions([
        {
          id: "1",
          name: "Grilled Chicken Salad",
          calories: Math.min(400, remainingCalories),
          protein: Math.min(25, remainingProtein),
          carbs: 15,
          fat: 12,
          tags: ["high-protein", "low-carb"],
        },
        {
          id: "2",
          name: "Quinoa Buddha Bowl",
          calories: Math.min(450, remainingCalories),
          protein: Math.min(18, remainingProtein),
          carbs: 45,
          fat: 15,
          tags: ["vegetarian", "balanced"],
        },
      ]);
    }
  }, [consumedScans, nutritionStats, dailyTargets]);

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

  // Render restaurant card
  const renderRestaurantCard = (restaurant: Restaurant) => (
    <TouchableOpacity
      key={restaurant.id}
      style={styles.restaurantCard}
      onPress={() => {
        router.push({
          pathname: "/(details)/restaurant-detail",
          params: {
            id: restaurant.id,
            place_id: restaurant.place_id,
          },
        });
      }}
    >
      <View style={styles.restaurantImageContainer}>
        {restaurant.image ? (
          <Image
            source={{ uri: restaurant.image }}
            style={styles.restaurantImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons
              name="restaurant"
              size={24}
              color={Colors.light.primary}
            />
          </View>
        )}
      </View>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{restaurant.name}</Text>
        <Text style={styles.restaurantDetails}>
          {restaurant.cuisine} • {restaurant.rating}★ • {restaurant.distance}
        </Text>
        <Text style={styles.restaurantAddress} numberOfLines={1}>
          {restaurant.vicinity}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render meal suggestion card
  const renderMealSuggestionCard = (meal: MealSuggestion) => (
    <TouchableOpacity
      key={meal.id}
      style={styles.mealCard}
      onPress={() => {
        // Handle meal selection
        Alert.alert(
          meal.name,
          `Calories: ${meal.calories}\nProtein: ${meal.protein}g\nCarbs: ${meal.carbs}g\nFat: ${meal.fat}g`
        );
      }}
    >
      <View style={styles.mealInfo}>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.mealCalories}>{meal.calories} cal</Text>
        <View style={styles.tagContainer}>
          {meal.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.firstName || "there"}! 👋
          </Text>
          <Text style={styles.subtitle}>Here's your nutrition overview</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Nutrition</Text>
            <TouchableOpacity
              onPress={() => router.push("/(details)/nutrition-overview")}
            >
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <CircleProgress
              size={120}
              strokeWidth={12}
              progress={Math.min(
                (nutritionStats.todayCalories / dailyTargets.calories) * 100,
                100
              )}
              label="Daily Calories"
              value={nutritionStats.todayCalories}
            />
            <CircleProgress
              size={120}
              strokeWidth={12}
              progress={Math.min(
                (nutritionStats.todayProtein / dailyTargets.protein) * 100,
                100
              )}
              label="Protein (g)"
              value={Math.round(nutritionStats.todayProtein)}
            />
            <CircleProgress
              size={120}
              strokeWidth={12}
              progress={Math.min(
                (nutritionStats.todayCarbs / dailyTargets.carbs) * 100,
                100
              )}
              label="Carbs (g)"
              value={Math.round(nutritionStats.todayCarbs)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Suggestions</Text>
          <Text style={styles.sectionSubtitle}>
            Based on your nutrition goals
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContainer}
          >
            {mealSuggestions.map(renderMealSuggestionCard)}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Healthy Restaurants</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.restaurantsContainer}
          >
            {nearbyRestaurants.map(renderRestaurantCard)}
          </ScrollView>
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
          <Text style={styles.sectionTitle}>Dietary Alerts</Text>
          {nutritionStats.todayProtein < dailyTargets.protein * 0.7 && (
            <View style={styles.alertCard}>
              <Ionicons name="warning" size={24} color={Colors.light.primary} />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Daily Protein Goal</Text>
                <Text style={styles.alertText}>
                  You're{" "}
                  {Math.round(
                    dailyTargets.protein - nutritionStats.todayProtein
                  )}
                  g below your daily protein target. Consider adding a
                  protein-rich snack.
                </Text>
              </View>
            </View>
          )}
          {nutritionStats.todayCalories > dailyTargets.calories && (
            <View style={styles.alertCard}>
              <Ionicons name="warning" size={24} color="#FF9800" />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Calorie Intake Alert</Text>
                <Text style={styles.alertText}>
                  You've exceeded your daily calorie target by{" "}
                  {Math.round(
                    nutritionStats.todayCalories - dailyTargets.calories
                  )}{" "}
                  calories.
                </Text>
              </View>
            </View>
          )}
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
  mealCard: {
    width: 200,
    backgroundColor: "white",
    borderRadius: 12,
    marginRight: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    backgroundColor: Colors.light.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.light.primary,
  },
  restaurantCard: {
    width: 280,
    backgroundColor: "white",
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  restaurantImageContainer: {
    height: 120,
    width: "100%",
  },
  restaurantImage: {
    width: "100%",
    height: "100%",
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  restaurantDetails: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  restaurantAddress: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  suggestionsContainer: {
    paddingVertical: 8,
  },
  restaurantsContainer: {
    paddingVertical: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  alertCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.primary + "10",
    padding: 16,
    borderRadius: 12,
    alignItems: "flex-start",
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
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
});
