import React from "react";
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
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useAuth } from "@clerk/clerk-expo";
import {
  useFoodDetail,
  useMarkAsConsumed,
  useDeleteScans,
} from "@/hooks/useQueries";

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams();
  const { userId } = useAuth();

  // Use TanStack Query hooks
  const { data: foodDetail, isLoading, error } = useFoodDetail(id as string);
  const markAsConsumed = useMarkAsConsumed();
  const deleteMutation = useDeleteScans();

  const handleMarkAsConsumed = async () => {
    try {
      await markAsConsumed.mutateAsync(id as string);
      Alert.alert("Success", "Food marked as consumed!");
      router.push("/(tabs)");
    } catch (err) {
      console.error("Error marking food as consumed:", err);
      Alert.alert(
        "Error",
        "Failed to mark food as consumed. Please try again."
      );
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Food",
      "Are you sure you want to delete this food scan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync([id as string]);
              Alert.alert("Success", "Food scan deleted successfully");
              router.back();
            } catch (err) {
              console.error("Error deleting food scan:", err);
              Alert.alert(
                "Error",
                "Failed to delete food scan. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!foodDetail) return;

    try {
      const message = `Check out my food scan!\n\n${foodDetail.foodName}\n\nNutrition Info:\nCalories: ${foodDetail.calories}\nProtein: ${foodDetail.protein}\nCarbs: ${foodDetail.carbs}\nFat: ${foodDetail.fat}`;
      await Share.share({
        message,
      });
    } catch (err) {
      console.error("Error sharing food scan:", err);
      Alert.alert("Error", "Failed to share food scan. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: "",
            headerStyle: {
              backgroundColor: "white",
            },
            headerShadowVisible: false,
            headerLeft:
              Platform.OS === "ios"
                ? () => (
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
                  )
                : undefined,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading food details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !foodDetail) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: "",
            headerStyle: {
              backgroundColor: "white",
            },
            headerShadowVisible: false,
            headerLeft:
              Platform.OS === "ios"
                ? () => (
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
                  )
                : undefined,
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.light.error}
          />
          <Text style={styles.errorText}>
            Failed to load food details. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.replace(`/(details)/food-detail?id=${id}`)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
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
          headerStyle: {
            backgroundColor: "white",
          },
          headerShadowVisible: false,
          headerLeft:
            Platform.OS === "ios"
              ? () => (
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
                )
              : undefined,
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

      <ScrollView style={styles.scrollView}>
        <View style={styles.imageContainer}>
          {foodDetail.imageUrl ? (
            <Image
              source={{ uri: foodDetail.imageUrl }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name="restaurant-outline"
                size={48}
                color={Colors.light.primary}
              />
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.foodName}>{foodDetail.foodName}</Text>
          <Text style={styles.scanDate}>
            {foodDetail.timestamp
              ? new Date(foodDetail.timestamp.toDate()).toLocaleString()
              : "Unknown date"}
          </Text>

          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Ionicons
                name="flame-outline"
                size={24}
                color={Colors.light.primary}
              />
              <Text style={styles.nutritionValue}>{foodDetail.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Ionicons name="barbell-outline" size={24} color="#4CAF50" />
              <Text style={[styles.nutritionValue, { color: "#4CAF50" }]}>
                {foodDetail.protein}
              </Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Ionicons name="leaf-outline" size={24} color="#2196F3" />
              <Text style={[styles.nutritionValue, { color: "#2196F3" }]}>
                {foodDetail.carbs}
              </Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Ionicons name="water-outline" size={24} color="#FF9800" />
              <Text style={[styles.nutritionValue, { color: "#FF9800" }]}>
                {foodDetail.fat}
              </Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
          </View>

          {foodDetail.allergens && foodDetail.allergens.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="warning-outline" size={24} color="#FF6B6B" />
                <Text style={styles.sectionTitle}>Allergens</Text>
              </View>
              <View style={styles.allergensTags}>
                {foodDetail.allergens.map((allergen, index) => (
                  <View key={index} style={styles.allergenTag}>
                    <Ionicons name="alert-circle" size={16} color="#E65100" />
                    <Text style={styles.allergenText}>{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {foodDetail.ingredients && foodDetail.ingredients.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="list-outline"
                  size={24}
                  color={Colors.light.primary}
                />
                <Text style={styles.sectionTitle}>Ingredients</Text>
              </View>
              <View style={styles.ingredientsList}>
                {foodDetail.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={Colors.light.primary}
                    />
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {foodDetail.additionalInfo && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={Colors.light.primary}
                />
                <Text style={styles.sectionTitle}>Additional Information</Text>
              </View>
              <Text style={styles.sectionText}>
                {foodDetail.additionalInfo}
              </Text>
            </View>
          )}

          {foodDetail.healthTips && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="fitness-outline" size={24} color="#4CAF50" />
                <Text style={styles.sectionTitle}>Health Tips</Text>
              </View>
              <Text style={styles.sectionText}>{foodDetail.healthTips}</Text>
            </View>
          )}

          {foodDetail.personalizedRecommendation && (
            <View
              style={[
                styles.section,
                {
                  backgroundColor: "#E8F5E9",
                  borderLeftWidth: 4,
                  borderLeftColor: Colors.light.primary,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={Colors.light.primary}
                />
                <Text style={styles.sectionTitle}>
                  Personalized Recommendation
                </Text>
              </View>
              <Text style={styles.sectionText}>
                {foodDetail.personalizedRecommendation}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {!foodDetail.isConsumed && (
        <TouchableOpacity
          style={styles.consumeButton}
          onPress={handleMarkAsConsumed}
        >
          <Ionicons
            name="restaurant"
            size={24}
            color={Colors.light.background}
          />
          <Text style={styles.consumeButtonText}>Eating it now</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
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
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#eee",
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    padding: 16,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  foodName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: "center",
  },
  scanDate: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  nutritionItem: {
    width: "48%",
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nutritionLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  section: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginLeft: 8,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
  },
  allergensTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  allergenTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  allergenText: {
    fontSize: 14,
    color: "#E65100",
    fontWeight: "500",
    marginLeft: 4,
  },
  ingredientsList: {
    marginTop: 8,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  ingredientText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
    flex: 1,
  },
  consumeButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  consumeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 8,
  },
});
