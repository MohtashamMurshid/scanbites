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
import { useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import Colors from "@/constants/Colors";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

type BusinessData = {
  businessName: string;
  email: string;
  ownerFullName: string;
  physicalAddress: string;
};

export default function ProfileScreen() {
  const { signOut, userId } = useAuth();
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!userId) return;

      try {
        const businessDoc = await getDoc(doc(db, "businesses", userId));
        if (businessDoc.exists()) {
          setBusinessData(businessDoc.data() as BusinessData);
        }
      } catch (error) {
        console.error("Error fetching business data:", error);
        Alert.alert("Error", "Failed to load business information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessData();
  }, [userId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
              <Text style={styles.avatarText}>
                {businessData?.businessName?.charAt(0) || "B"}
              </Text>
            </View>
          </View>
          <Text style={styles.profileName}>
            {businessData?.businessName || "Business Name"}
          </Text>
          <Text style={styles.profileEmail}>
            {businessData?.email || "email@example.com"}
          </Text>
          <Text style={styles.ownerName}>
            Owner: {businessData?.ownerFullName || "Owner Name"}
          </Text>
          <View style={styles.addressContainer}>
            <Ionicons
              name="location"
              size={16}
              color={Colors.light.textSecondary}
            />
            <Text style={styles.addressText}>
              {businessData?.physicalAddress || "No address provided"}
            </Text>
          </View>

          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/profile")}
            >
              <Ionicons
                name="business"
                size={24}
                color={Colors.light.primary}
              />
              <Text style={styles.menuItemText}>Business Information</Text>
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
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  ownerName: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
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
    alignItems: "center",
    paddingVertical: 8,
  },
  preferenceText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 8,
  },
  addButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    marginLeft: 8,
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
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  addressText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 8,
    flex: 1,
    textAlign: "center",
  },
});
