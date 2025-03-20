import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Stack, router } from "expo-router";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@clerk/clerk-expo";

type FoodScan = {
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
  allergens?: string[];
};

export default function FoodHistoryScreen() {
  const { userId } = useAuth();
  const [foodScans, setFoodScans] = useState<FoodScan[]>([]);
  const [filteredScans, setFilteredScans] = useState<FoodScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const fetchScans = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Query Firestore for all food scans by this user
      const scansRef = collection(db, "nutritionData");
      const q = query(
        scansRef,
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      );

      const querySnapshot = await getDocs(q);
      const scanData: FoodScan[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        scanData.push({
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
          scanDate: data.scanDate || "",
          allergens: data.allergens || [],
        });
      });

      setFoodScans(scanData);
      setFilteredScans(scanData);
    } catch (err) {
      console.error("Error fetching food scans:", err);
      setError("Failed to load your food history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [userId]);

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedItems(new Set());
  };

  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  // Select all items
  const selectAllItems = () => {
    if (selectedItems.size === filteredScans.length) {
      // If all items are already selected, deselect all
      setSelectedItems(new Set());
    } else {
      // Otherwise, select all items
      const allIds = filteredScans.map((item) => item.id);
      setSelectedItems(new Set(allIds));
    }
  };

  // Delete selected items
  const deleteSelectedItems = async () => {
    if (selectedItems.size === 0) return;

    Alert.alert(
      "Delete Selected Items",
      `Are you sure you want to delete ${selectedItems.size} selected items?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const batch = writeBatch(db);

              selectedItems.forEach((id) => {
                const docRef = doc(db, "nutritionData", id);
                batch.delete(docRef);
              });

              await batch.commit();

              // Reset selection and refresh data
              setSelectionMode(false);
              setSelectedItems(new Set());
              fetchScans();

              Alert.alert(
                "Success",
                `Deleted ${selectedItems.size} items successfully.`
              );
            } catch (err) {
              console.error("Error deleting items:", err);
              setError("Failed to delete items. Please try again.");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Apply filters when search query, selected filter, or date range changes
  useEffect(() => {
    if (!foodScans.length) return;

    let filtered = [...foodScans];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((scan) =>
        scan.foodName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply nutrition filter
    if (selectedFilter === "high-protein") {
      filtered = filtered.filter((scan) => scan.proteinNum >= 20);
    } else if (selectedFilter === "low-carb") {
      filtered = filtered.filter((scan) => scan.carbsNum <= 15);
    } else if (selectedFilter === "low-calorie") {
      filtered = filtered.filter((scan) => scan.caloriesNum <= 300);
    }

    // Apply date filter
    if (dateRange === "today") {
      const today = new Date().toISOString().split("T")[0];
      filtered = filtered.filter((scan) => scan.scanDate === today);
    } else if (dateRange === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter((scan) => {
        if (!scan.timestamp) return false;
        return scan.timestamp.toDate() >= weekAgo;
      });
    } else if (dateRange === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter((scan) => {
        if (!scan.timestamp) return false;
        return scan.timestamp.toDate() >= monthAgo;
      });
    }

    setFilteredScans(filtered);
  }, [foodScans, searchQuery, selectedFilter, dateRange]);

  const renderFoodScan = ({ item }: { item: FoodScan }) => {
    const isSelected = selectedItems.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.foodCard, isSelected && styles.selectedFoodCard]}
        onPress={() => {
          if (selectionMode) {
            toggleItemSelection(item.id);
          } else {
            router.push({
              pathname: "/(details)/food-detail",
              params: { id: item.id },
            });
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleItemSelection(item.id);
          }
        }}
      >
        {selectionMode && (
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                isSelected
                  ? styles.checkboxSelected
                  : styles.checkboxUnselected,
              ]}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.foodImageContainer}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
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
          </View>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName}>{item.foodName}</Text>
            <Text style={styles.scanDate}>
              {item.timestamp
                ? new Date(item.timestamp.toDate()).toLocaleString()
                : "Unknown date"}
            </Text>
          </View>
        </View>

        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Calories</Text>
            <Text style={styles.nutritionValue}>
              {item.caloriesNum ? `${item.caloriesNum} kcal` : item.calories}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Protein</Text>
            <Text style={styles.nutritionValue}>
              {item.proteinNum ? `${item.proteinNum}g` : item.protein}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Carbs</Text>
            <Text style={styles.nutritionValue}>
              {item.carbsNum ? `${item.carbsNum}g` : item.carbs}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Fat</Text>
            <Text style={styles.nutritionValue}>
              {item.fatNum ? `${item.fatNum}g` : item.fat}
            </Text>
          </View>
        </View>

        {item.allergens && item.allergens.length > 0 && (
          <View style={styles.allergensContainer}>
            <Text style={styles.allergensLabel}>Allergens:</Text>
            <View style={styles.allergensTags}>
              {item.allergens.map((allergen, index) => (
                <View key={index} style={styles.allergenTag}>
                  <Text style={styles.allergenText}>{allergen}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const FilterOption = ({
    title,
    value,
    current,
    onSelect,
  }: {
    title: string;
    value: string;
    current: string;
    onSelect: (value: string) => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterOption,
        current === value && styles.filterOptionSelected,
      ]}
      onPress={() => onSelect(value)}
    >
      <Text
        style={[
          styles.filterText,
          current === value && styles.filterTextSelected,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading your food history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "" }} />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.light.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.replace("/(history)/food-history")}
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
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
          },
          headerRight: () => (
            <View style={styles.headerButtons}>
              {selectionMode ? (
                <>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={selectAllItems}
                  >
                    <Ionicons
                      name={
                        selectedItems.size === filteredScans.length
                          ? "checkbox"
                          : "square-outline"
                      }
                      size={22}
                      color={Colors.light.primary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={deleteSelectedItems}
                    disabled={selectedItems.size === 0}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color={
                        selectedItems.size > 0
                          ? Colors.light.error
                          : Colors.light.textSecondary
                      }
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={toggleSelectionMode}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={Colors.light.primary}
                    />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={toggleSelectionMode}
                  >
                    <Ionicons
                      name="ellipsis-horizontal-circle-outline"
                      size={24}
                      color={Colors.light.primary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => router.push("/(tabs)/scan")}
                  >
                    <Ionicons
                      name="scan"
                      size={24}
                      color={Colors.light.primary}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
        }}
      />

      <View style={styles.searchContainer}>
        <View style={styles.pageTitle}>
          <Text style={styles.pageTitleText}>Food History</Text>
        </View>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.light.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.light.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <FilterOption
            title="All"
            value="all"
            current={selectedFilter}
            onSelect={setSelectedFilter}
          />
          <FilterOption
            title="High Protein"
            value="high-protein"
            current={selectedFilter}
            onSelect={setSelectedFilter}
          />
          <FilterOption
            title="Low Carb"
            value="low-carb"
            current={selectedFilter}
            onSelect={setSelectedFilter}
          />
          <FilterOption
            title="Low Calorie"
            value="low-calorie"
            current={selectedFilter}
            onSelect={setSelectedFilter}
          />
        </ScrollView>
      </View>

      <View style={styles.dateFilterContainer}>
        <Text style={styles.dateFilterLabel}>Time Period:</Text>
        <View style={styles.dateFilterOptions}>
          <FilterOption
            title="All Time"
            value="all"
            current={dateRange}
            onSelect={setDateRange}
          />
          <FilterOption
            title="Today"
            value="today"
            current={dateRange}
            onSelect={setDateRange}
          />
          <FilterOption
            title="This Week"
            value="week"
            current={dateRange}
            onSelect={setDateRange}
          />
          <FilterOption
            title="This Month"
            value="month"
            current={dateRange}
            onSelect={setDateRange}
          />
        </View>
      </View>

      {selectionMode && selectedItems.size > 0 && (
        <View style={styles.selectionInfoBar}>
          <Text style={styles.selectionInfoText}>
            {selectedItems.size} {selectedItems.size === 1 ? "item" : "items"}{" "}
            selected
          </Text>
        </View>
      )}

      {filteredScans.length > 0 ? (
        <FlatList
          data={filteredScans}
          renderItem={renderFoodScan}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="nutrition-outline"
            size={64}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.emptyTitle}>No food scans found</Text>
          <Text style={styles.emptyText}>
            {searchQuery || selectedFilter !== "all" || dateRange !== "all"
              ? "Try adjusting your filters to see more results."
              : "Start scanning your food to track your nutrition journey."}
          </Text>
          <TouchableOpacity
            style={styles.scanNowButton}
            onPress={() => router.push("/(tabs)/scan")}
          >
            <Text style={styles.scanNowButtonText}>Scan Food Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "white",
  },
  pageTitle: {
    marginBottom: 12,
  },
  pageTitleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    paddingVertical: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
  },
  filterOptionSelected: {
    backgroundColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  filterTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  dateFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  dateFilterLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  dateFilterOptions: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120, // Extra space at bottom
  },
  foodCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedFoodCard: {
    backgroundColor: "#f0f8ff", // Light blue background when selected
    borderColor: Colors.light.primary,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  foodImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
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
    borderRadius: 8,
  },
  foodInfo: {
    flex: 1,
    justifyContent: "center",
  },
  foodName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  scanDate: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  nutritionGrid: {
    flexDirection: "row",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  nutritionItem: {
    width: "25%",
    paddingVertical: 8,
  },
  nutritionLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  allergensContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    paddingTop: 12,
  },
  allergensLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    color: Colors.light.text,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: Colors.light.textSecondary,
    marginBottom: 24,
  },
  scanNowButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanNowButtonText: {
    color: "white",
    fontWeight: "600",
  },
  scanButton: {
    marginLeft: 8,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    marginLeft: 10,
    padding: 3,
  },
  checkboxContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.light.primary,
  },
  checkboxUnselected: {
    backgroundColor: "#EEEEEE",
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  selectionInfoBar: {
    backgroundColor: Colors.light.primary + "15",
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  selectionInfoText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
});
