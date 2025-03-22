import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import Colors from "@/constants/Colors";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

// Define preference types
type UserPreferences = {
  dietaryPreferences: Record<number, string | string[]>;
  completedAt: string;
};

type Preference = {
  id: string;
  label: string;
  options: string[];
  isMultiSelect?: boolean;
};

export default function EditProfileScreen() {
  const { userId } = useAuth();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, string[]>>({
    allergies: [],
    dietaryRestrictions: [],
  });

  // Define available preferences
  const availablePreferences: Preference[] = [
    {
      id: "allergies",
      label: "Food Allergies",
      options: [
        "Dairy",
        "Eggs",
        "Peanuts",
        "Tree Nuts",
        "Fish",
        "Shellfish",
        "Soy",
        "Wheat",
        "Gluten",
      ],
      isMultiSelect: true,
    },
    {
      id: "dietaryRestrictions",
      label: "Dietary Restrictions",
      options: [
        "Vegetarian",
        "Vegan",
        "Pescatarian",
        "Keto",
        "Paleo",
        "Low-carb",
        "Dairy-free",
        "Gluten-free",
        "None",
      ],
      isMultiSelect: true,
    },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        const userDoc = await getDoc(doc(db, "userPreferences", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserPreferences;

          // Map from questionnaire format to our simpler format
          const allergies: string[] = [];
          const dietaryRestrictions: string[] = [];

          // Check if user has allergies
          if (
            userData.dietaryPreferences[1] === "Yes" &&
            Array.isArray(userData.dietaryPreferences[2])
          ) {
            allergies.push(...userData.dietaryPreferences[2]);
          }

          // Get dietary restrictions
          if (Array.isArray(userData.dietaryPreferences[3])) {
            dietaryRestrictions.push(
              ...userData.dietaryPreferences[3].filter((r) => r !== "None")
            );
          }

          setPreferences({
            allergies,
            dietaryRestrictions,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to load your profile information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleToggleOption = (preferenceId: string, option: string) => {
    setPreferences((prevPreferences) => {
      const currentOptions = [...(prevPreferences[preferenceId] || [])];

      // Handle "None" option specially for dietary restrictions
      if (preferenceId === "dietaryRestrictions") {
        if (option === "None") {
          return {
            ...prevPreferences,
            [preferenceId]: currentOptions.includes(option) ? [] : ["None"],
          };
        } else if (currentOptions.includes("None")) {
          // Remove "None" when selecting other options
          const withoutNone = currentOptions.filter((o) => o !== "None");
          return {
            ...prevPreferences,
            [preferenceId]: [...withoutNone, option],
          };
        }
      }

      // Regular toggle behavior
      if (currentOptions.includes(option)) {
        return {
          ...prevPreferences,
          [preferenceId]: currentOptions.filter((o) => o !== option),
        };
      } else {
        return {
          ...prevPreferences,
          [preferenceId]: [...currentOptions, option],
        };
      }
    });
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert("Error", "User not found. Please try signing in again.");
      return;
    }

    setIsSaving(true);
    try {
      // Convert from our simple format back to questionnaire format
      const dietaryPreferences: Record<number, string | string[]> = {};

      // Question 1: Do you have any food allergies?
      dietaryPreferences[1] = preferences.allergies.length > 0 ? "Yes" : "No";

      // Question 2: Which food allergens affect you?
      dietaryPreferences[2] = preferences.allergies;

      // Question 3: Do you have any dietary restrictions?
      dietaryPreferences[3] =
        preferences.dietaryRestrictions.length > 0
          ? preferences.dietaryRestrictions
          : ["None"];

      // Update Firebase document
      await updateDoc(doc(db, "userPreferences", userId), {
        dietaryPreferences,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Your profile has been updated", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isSaving) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Saving your preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.userInfoSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={styles.userName}>My Nutrition Profile</Text>
          {user?.primaryEmailAddress?.emailAddress && (
            <Text style={styles.userEmail}>
              {user.primaryEmailAddress.emailAddress}
            </Text>
          )}
        </View>

        {availablePreferences.map((preference) => (
          <View key={preference.id} style={styles.preferenceSection}>
            <Text style={styles.preferenceTitle}>{preference.label}</Text>
            <View style={styles.optionsContainer}>
              {preference.options.map((option) => {
                const isSelected = preferences[preference.id]?.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      isSelected && styles.selectedOptionButton,
                    ]}
                    onPress={() => handleToggleOption(preference.id, option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  userInfoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  preferenceSection: {
    marginBottom: 24,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionButton: {
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOptionButton: {
    backgroundColor: Colors.light.primary + "20",
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  optionText: {
    fontSize: 14,
    color: "#666",
  },
  selectedOptionText: {
    color: Colors.light.primary,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 24,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
