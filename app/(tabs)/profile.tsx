import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import Colors from "@/constants/Colors";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

type UserPreferences = {
  dietaryPreferences: Record<number, string | string[]>;
  completedAt: string;
};

export default function ProfileScreen() {
  const { signOut, userId } = useAuth();
  const { user } = useUser();
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        const userDoc = await getDoc(doc(db, "userPreferences", userId));
        if (userDoc.exists()) {
          setUserPreferences(userDoc.data() as UserPreferences);
        }

        // Get user email from Clerk
        if (user?.primaryEmailAddress) {
          setUserEmail(user.primaryEmailAddress.emailAddress);
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        Alert.alert("Error", "Failed to load your nutrition preferences");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, user]);

  // Helper function to extract allergies
  const getAllergies = (): string[] => {
    if (!userPreferences?.dietaryPreferences) return [];

    // Question 1 is "Do you have any food allergies?"
    // Question 2 is "If yes, which food allergens affect you?"
    const hasAllergies = userPreferences.dietaryPreferences[1] === "Yes";
    if (!hasAllergies) return [];

    return Array.isArray(userPreferences.dietaryPreferences[2])
      ? userPreferences.dietaryPreferences[2]
      : [];
  };

  // Helper function to extract dietary restrictions
  const getDietaryRestrictions = (): string[] => {
    if (!userPreferences?.dietaryPreferences) return [];

    // Question 3 is "Do you have any dietary restrictions?"
    const restrictions = userPreferences.dietaryPreferences[3];
    return Array.isArray(restrictions)
      ? restrictions.filter((r) => r !== "None")
      : [];
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

  const allergies = getAllergies();
  const dietaryRestrictions = getDietaryRestrictions();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons
            name="settings-outline"
            size={24}
            color={Colors.light.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          </View>
          <Text style={styles.profileName}>My Nutrition Profile</Text>
          {userEmail ? (
            <View style={styles.emailContainer}>
              <Ionicons
                name="mail-outline"
                size={16}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.emailText}>{userEmail}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push("/(modals)/edit-profile")}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Preferences</Text>
          <View style={styles.card}>
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceIcon}>
                <Ionicons name="warning" size={18} color="#FF9500" />
              </View>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceTitle}>Food Allergies</Text>
                {allergies.length > 0 ? (
                  <View style={styles.tagContainer}>
                    {allergies.map((allergy, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{allergy}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No allergies reported</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceIcon}>
                <Ionicons name="restaurant" size={18} color="#4CD964" />
              </View>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceTitle}>Dietary Restrictions</Text>
                {dietaryRestrictions.length > 0 ? (
                  <View style={styles.tagContainer}>
                    {dietaryRestrictions.map((restriction, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{restriction}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No dietary restrictions</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons
                name="nutrition"
                size={24}
                color={Colors.light.primary}
              />
              <Text style={styles.menuItemText}>Nutrition History</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.light.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons
                name="notifications"
                size={24}
                color={Colors.light.primary}
              />
              <Text style={styles.menuItemText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="shield" size={24} color={Colors.light.primary} />
              <Text style={styles.menuItemText}>Privacy & Security</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutButton]}
              onPress={() => {
                Alert.alert("Log Out", "Are you sure you want to log out?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                      await signOut();
                      router.replace("/(auth)/sign-in");
                    },
                  },
                ]);
              }}
            >
              <Ionicons name="log-out" size={24} color="#ff3b30" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  settingsButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  emailText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 6,
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  editProfileText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  preferenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  tag: {
    backgroundColor: Colors.light.primary + "15",
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: "500",
  },
  noDataText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  logoutButton: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: "#ff3b30",
    marginLeft: 12,
  },
});
