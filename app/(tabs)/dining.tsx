import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useState } from "react";

type Customer = {
  id: string;
  name: string;
  tableNumber: string;
  time: string;
  status: "dining" | "completed";
  items: string[];
};

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "1",
    name: "John Smith",
    tableNumber: "T1",
    time: "12:30 PM",
    status: "dining",
    items: ["Burger Special", "Coke"],
  },
  {
    id: "2",
    name: "Sarah Johnson",
    tableNumber: "T4",
    time: "1:15 PM",
    status: "dining",
    items: ["Chicken Wings", "Fries", "Sprite"],
  },
  {
    id: "3",
    name: "Mike Brown",
    tableNumber: "T2",
    time: "12:00 PM",
    status: "completed",
    items: ["Pizza", "Salad", "Water"],
  },
];

export default function DiningScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"dining" | "completed">("dining");

  const filteredCustomers = MOCK_CUSTOMERS.filter(
    (customer) =>
      customer.status === activeTab &&
      (customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dining Customers</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.light.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or table number"
            placeholderTextColor={Colors.light.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "dining" && styles.activeTab]}
          onPress={() => setActiveTab("dining")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "dining" && styles.activeTabText,
            ]}
          >
            Currently Dining
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.activeTab]}
          onPress={() => setActiveTab("completed")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "completed" && styles.activeTabText,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="restaurant-outline"
              size={48}
              color={Colors.light.textSecondary}
            />
            <Text style={styles.emptyStateText}>No customers found</Text>
          </View>
        ) : (
          filteredCustomers.map((customer) => (
            <View key={customer.id} style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <View style={styles.tableContainer}>
                    <Ionicons
                      name="restaurant"
                      size={14}
                      color={Colors.light.textSecondary}
                    />
                    <Text style={styles.tableNumber}>
                      Table {customer.tableNumber}
                    </Text>
                  </View>
                </View>
                <Text style={styles.timeText}>{customer.time}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsTitle}>Items Ordered:</Text>
                {customer.items.map((item, index) => (
                  <Text key={index} style={styles.itemText}>
                    • {item}
                  </Text>
                ))}
              </View>
            </View>
          ))
        )}
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
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    padding: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  activeTabText: {
    color: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 16,
  },
  customerCard: {
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
    elevation: 3,
  },
  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  tableContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tableNumber: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  timeText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 12,
  },
  itemsContainer: {
    marginTop: 4,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
});
