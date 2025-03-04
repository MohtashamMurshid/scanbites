import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@clerk/clerk-expo";

type BusinessData = {
  businessName: string;
  email: string;
  ownerFullName: string;
  physicalAddress: string;
};

export default function HomeScreen() {
  const { userId } = useAuth();
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
        <View>
          <Text style={styles.headerTitle}>Welcome back,</Text>
          <Text style={styles.businessName}>
            {businessData?.businessName || "Business Name"}
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={Colors.light.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Ready to scan?</Text>
          <Text style={styles.welcomeDescription}>
            Use the scan button below to start scanning food items and managing
            your inventory.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No recent scans</Text>
            <Text style={styles.cardDescription}>
              Tap the scan button to start scanning food items
            </Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Scan Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Best Sellers</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
          >
            <View style={styles.foodItemCard}>
              <View style={styles.foodImagePlaceholder}>
                <Ionicons
                  name="fast-food"
                  size={30}
                  color={Colors.light.textSecondary}
                />
              </View>
              <Text style={styles.foodItemName}>Burger Special</Text>
              <Text style={styles.foodItemPrice}>$12.99</Text>
            </View>
            <View style={styles.foodItemCard}>
              <View style={styles.foodImagePlaceholder}>
                <Ionicons
                  name="pizza"
                  size={30}
                  color={Colors.light.textSecondary}
                />
              </View>
              <Text style={styles.foodItemName}>Pepperoni Pizza</Text>
              <Text style={styles.foodItemPrice}>$14.99</Text>
            </View>
            <View style={styles.foodItemCard}>
              <View style={styles.foodImagePlaceholder}>
                <Ionicons
                  name="restaurant"
                  size={30}
                  color={Colors.light.textSecondary}
                />
              </View>
              <Text style={styles.foodItemName}>Chicken Wings</Text>
              <Text style={styles.foodItemPrice}>$10.99</Text>
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.addFoodButton}>
          <Ionicons
            name="add-circle"
            size={24}
            color={Colors.light.background}
          />
          <Text style={styles.addFoodButtonText}>Add Food Item</Text>
        </TouchableOpacity>
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
  businessName: {
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
  },
  welcomeSection: {
    marginBottom: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.light.background,
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 16,
    color: Colors.light.background,
    opacity: 0.9,
    lineHeight: 22,
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
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: Colors.light.text,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  actionButtonText: {
    color: Colors.light.background,
    fontSize: 14,
    fontWeight: "600",
  },
  horizontalScroll: {
    flexDirection: "row",
    marginHorizontal: -8,
  },
  foodItemCard: {
    width: 150,
    marginHorizontal: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    shadowColor: Colors.light.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodImagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  foodItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  addFoodButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  addFoodButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
