import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

export default function ScanScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Food</Text>
      </View>

      <View style={styles.cameraContainer}>
        <View style={styles.cameraPlaceholder}>
          <Ionicons
            name="camera"
            size={80}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.cameraText}>Camera preview will appear here</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.scanButton}>
          <Ionicons name="scan" size={30} color={Colors.light.background} />
          <Text style={styles.scanButtonText}>Scan Food</Text>
        </TouchableOpacity>

        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton}>
            <Ionicons name="image" size={24} color={Colors.light.primary} />
            <Text style={styles.optionText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton}>
            <Ionicons
              name="flashlight"
              size={24}
              color={Colors.light.primary}
            />
            <Text style={styles.optionText}>Flash</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.text,
  },
  cameraPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  cameraText: {
    color: Colors.light.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  controlsContainer: {
    padding: 20,
    backgroundColor: Colors.light.background,
  },
  scanButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  scanButtonText: {
    color: Colors.light.background,
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  optionButton: {
    alignItems: "center",
  },
  optionText: {
    color: Colors.light.primary,
    marginTop: 8,
    fontSize: 14,
  },
});
