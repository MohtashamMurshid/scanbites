import { StyleSheet, ScrollView, View, TouchableOpacity } from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ScanBites</Text>
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
          <Text style={styles.welcomeText}>Welcome to ScanBites!</Text>
          <Text style={styles.welcomeDescription}>
            Scan food items to get detailed nutritional information and make
            healthier choices.
          </Text>
        </View>
        <Link href="/(onboarding)/business-registration" asChild>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Register Your Business</Text>
          </TouchableOpacity>
        </Link>

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
            <Text style={styles.sectionTitle}>Nutrition Summary</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No data available</Text>
            <Text style={styles.cardDescription}>
              Your nutrition summary will appear here after scanning food items
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Restaurants</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
          >
            <View style={styles.restaurantCard}>
              <View style={styles.restaurantImagePlaceholder}>
                <Ionicons
                  name="restaurant"
                  size={30}
                  color={Colors.light.textSecondary}
                />
              </View>
              <Text style={styles.restaurantName}>Restaurant Name</Text>
              <Text style={styles.restaurantDistance}>1.2 miles away</Text>
            </View>
            <View style={styles.restaurantCard}>
              <View style={styles.restaurantImagePlaceholder}>
                <Ionicons
                  name="restaurant"
                  size={30}
                  color={Colors.light.textSecondary}
                />
              </View>
              <Text style={styles.restaurantName}>Another Place</Text>
              <Text style={styles.restaurantDistance}>2.5 miles away</Text>
            </View>
            <View style={styles.restaurantCard}>
              <View style={styles.restaurantImagePlaceholder}>
                <Ionicons
                  name="restaurant"
                  size={30}
                  color={Colors.light.textSecondary}
                />
              </View>
              <Text style={styles.restaurantName}>Food Corner</Text>
              <Text style={styles.restaurantDistance}>3.0 miles away</Text>
            </View>
          </ScrollView>
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
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.light.primary,
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
  restaurantCard: {
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
  restaurantImagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  restaurantDistance: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
