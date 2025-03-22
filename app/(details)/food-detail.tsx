import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@clerk/clerk-expo";

type FoodDetail = {
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
  fiber: string;
  sugar: string;
  imageUrl: string;
  timestamp: any;
  scanDate: string;
  allergens?: string[];
  additionalInfo?: string;
  healthTips?: string;
  personalizedRecommendation?: string;
};

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams();
  const { userId } = useAuth();
  const [food, setFood] = useState<FoodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No food item ID provided");
      setLoading(false);
      return;
    }

    const fetchFoodDetail = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "nutritionData", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFood({
            id: docSnap.id,
            foodName: data.foodName || "Unknown Food",
            calories: data.calories || "0 kcal",
            caloriesNum: data.caloriesNum || 0,
            protein: data.protein || "0g",
            proteinNum: data.proteinNum || 0,
            carbs: data.carbs || "0g",
            carbsNum: data.carbsNum || 0,
            fat: data.fat || "0g",
            fatNum: data.fatNum || 0,
            fiber: data.fiber || "0g",
            sugar: data.sugar || "0g",
            imageUrl: data.imageUrl || "",
            timestamp: data.timestamp,
            scanDate: data.scanDate || "",
            allergens: data.allergens || [],
            additionalInfo: data.additionalInfo || "",
            healthTips: data.healthTips || "",
            personalizedRecommendation: data.personalizedRecommendation || "",
          });
        } else {
          setError("Food item not found");
        }
      } catch (err) {
        console.error("Error fetching food details:", err);
        setError("Failed to load food details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDetail();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Food Entry",
      "Are you sure you want to delete this food entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "nutritionData", id as string));
              Alert.alert("Success", "Food entry has been deleted.");
              router.back();
            } catch (err) {
              console.error("Error deleting food entry:", err);
              Alert.alert(
                "Error",
                "Failed to delete food entry. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!food) return;

    try {
      const nutritionInfo = `
Food: ${food.foodName}
Calories: ${food.caloriesNum ? `${food.caloriesNum} kcal` : food.calories}
Protein: ${food.proteinNum ? `${food.proteinNum}g` : food.protein}
Carbs: ${food.carbsNum ? `${food.carbsNum}g` : food.carbs}
Fat: ${food.fatNum ? `${food.fatNum}g` : food.fat}
${food.fiber ? `Fiber: ${food.fiber}` : ""}
${food.sugar ? `Sugar: ${food.sugar}` : ""}
${
  food.allergens && food.allergens.length > 0
    ? `Allergens: ${food.allergens.join(", ")}`
    : "No allergens detected"
}
      `;

      await Share.share({
        message: `Check out the nutrition information I scanned with ScanBites!\n${nutritionInfo}`,
        title: `ScanBites - ${food.foodName}`,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share food details");
    }
  };

  const renderNutritionSection = () => {
    if (!food) return null;

    return (
      <View style={styles.nutritionSection}>
        <Text style={styles.sectionTitle}>Nutrition Information</Text>

        <View style={styles.macroContainer}>
          <View style={styles.macroCircle}>
            <Text style={styles.macroValue}>{food.caloriesNum}</Text>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>

          <View style={styles.nutritionBarContainer}>
            <View style={styles.nutritionBar}>
              <View
                style={[
                  styles.nutritionBarFill,
                  {
                    width: `${Math.min(
                      (food.proteinNum /
                        (food.proteinNum + food.carbsNum + food.fatNum)) *
                        100,
                      100
                    )}%`,
                    backgroundColor: "#4CAF50",
                  },
                ]}
              />
              <Text style={styles.nutritionBarLabel}>
                Protein:{" "}
                {food.proteinNum ? `${food.proteinNum}g` : food.protein}
              </Text>
            </View>

            <View style={styles.nutritionBar}>
              <View
                style={[
                  styles.nutritionBarFill,
                  {
                    width: `${Math.min(
                      (food.carbsNum /
                        (food.proteinNum + food.carbsNum + food.fatNum)) *
                        100,
                      100
                    )}%`,
                    backgroundColor: "#2196F3",
                  },
                ]}
              />
              <Text style={styles.nutritionBarLabel}>
                Carbs: {food.carbsNum ? `${food.carbsNum}g` : food.carbs}
              </Text>
            </View>

            <View style={styles.nutritionBar}>
              <View
                style={[
                  styles.nutritionBarFill,
                  {
                    width: `${Math.min(
                      (food.fatNum /
                        (food.proteinNum + food.carbsNum + food.fatNum)) *
                        100,
                      100
                    )}%`,
                    backgroundColor: "#FF9800",
                  },
                ]}
              />
              <Text style={styles.nutritionBarLabel}>
                Fat: {food.fatNum ? `${food.fatNum}g` : food.fat}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.additionalNutrition}>
          {food.fiber && (
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionItemLabel}>Fiber</Text>
              <Text style={styles.nutritionItemValue}>{food.fiber}</Text>
            </View>
          )}

          {food.sugar && (
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionItemLabel}>Sugar</Text>
              <Text style={styles.nutritionItemValue}>{food.sugar}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderAllergensSection = () => {
    if (!food || !food.allergens || food.allergens.length === 0) return null;

    return (
      <View style={styles.allergensSection}>
        <Text style={styles.sectionTitle}>Allergens</Text>
        <View style={styles.allergensTags}>
          {food.allergens.map((allergen, index) => (
            <View key={index} style={styles.allergenTag}>
              <Text style={styles.allergenText}>{allergen}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderHealthTipsSection = () => {
    if (!food || !food.healthTips) return null;

    return (
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Health Tips</Text>
        <Text style={styles.tipsText}>{food.healthTips}</Text>
      </View>
    );
  };

  const renderPersonalizedSection = () => {
    if (!food || !food.personalizedRecommendation) return null;

    // Ensure recommendation is defined before calling split
    const recommendations =
      typeof food.personalizedRecommendation === "string"
        ? food.personalizedRecommendation
            .split("\n")
            .filter((rec) => rec.trim().length > 0)
        : [];

    if (recommendations.length === 0) return null;

    return (
      <View style={styles.personalizedSection}>
        <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
        {recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.light.primary}
              style={styles.recommendationIcon}
            />
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading food details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !food) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "" }} />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.light.error}
          />
          <Text style={styles.errorText}>
            {error || "Unknown error occurred"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "",
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleShare}
              >
                <Ionicons
                  name="share-outline"
                  size={24}
                  color={Colors.light.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleDelete}
              >
                <Ionicons
                  name="trash-outline"
                  size={24}
                  color={Colors.light.error}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.imageContainer}>
          {food.imageUrl ? (
            <Image
              source={{ uri: food.imageUrl }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="restaurant"
                size={64}
                color={Colors.light.primary}
              />
            </View>
          )}
        </View>

        <View style={styles.foodHeader}>
          <Text style={styles.foodName}>{food.foodName}</Text>
          <Text style={styles.scanDate}>
            Scanned on{" "}
            {food.timestamp
              ? new Date(food.timestamp.toDate()).toLocaleString()
              : "Unknown date"}
          </Text>
        </View>

        {renderNutritionSection()}
        {renderAllergensSection()}
        {renderHealthTipsSection()}
        {renderPersonalizedSection()}

        {food.additionalInfo && (
          <View style={styles.additionalInfoSection}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <Text style={styles.additionalInfoText}>{food.additionalInfo}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.scanAgainButton}
          onPress={() => router.push("/(tabs)/scan")}
        >
          <Text style={styles.scanAgainButtonText}>Scan Another Food</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: Colors.light.error,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  headerButtons: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 16,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee",
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  foodHeader: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  foodName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  scanDate: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  nutritionSection: {
    padding: 16,
    backgroundColor: "white",
    marginTop: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  macroContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  macroCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  macroLabel: {
    fontSize: 12,
    color: "white",
  },
  nutritionBarContainer: {
    flex: 1,
  },
  nutritionBar: {
    height: 22,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
    position: "relative",
  },
  nutritionBarFill: {
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
  },
  nutritionBarLabel: {
    fontSize: 12,
    color: "black",
    position: "absolute",
    left: 8,
    top: 3,
    fontWeight: "500",
  },
  additionalNutrition: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  nutritionItem: {
    width: "50%",
    paddingVertical: 8,
  },
  nutritionItemLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  nutritionItemValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  allergensSection: {
    padding: 16,
    backgroundColor: "white",
    marginTop: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  allergensTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  allergenTag: {
    backgroundColor: "#FFF3E0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  allergenText: {
    color: "#E65100",
    fontWeight: "500",
    fontSize: 12,
  },
  tipsSection: {
    padding: 16,
    backgroundColor: "white",
    marginTop: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
  personalizedSection: {
    padding: 16,
    backgroundColor: "white",
    marginTop: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recommendationIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
  additionalInfoSection: {
    padding: 16,
    backgroundColor: "white",
    marginTop: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  additionalInfoText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
  scanAgainButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 24,
    alignItems: "center",
  },
  scanAgainButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
