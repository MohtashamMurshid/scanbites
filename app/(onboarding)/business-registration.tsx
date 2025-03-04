import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "../../constants/Colors";

export default function BusinessRegistration() {
  const { user } = useUser();
  const { userId, getToken } = useAuth();
  const params = useLocalSearchParams();
  const [formData, setFormData] = useState({
    businessName: "",
    ownerFullName: "",
    email: "",
    phone: "",
    physicalAddress: "",
    businessLicense: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-populate email from params or Clerk
  useEffect(() => {
    if (params.email) {
      setFormData((prev) => ({ ...prev, email: params.email as string }));
    } else {
      setFormData((prev) => ({
        ...prev,
        email: user?.emailAddresses[0].emailAddress || "",
      }));
    }
  }, [params.email]);

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert("Error", "You must be logged in to register a business");
      return;
    }

    try {
      setIsSubmitting(true);

      // Validate form data
      const requiredFields = Object.entries(formData);
      for (const [key, value] of requiredFields) {
        if (key === "email") continue; // Skip email validation as it's pre-filled
        if (!value.trim()) {
          Alert.alert(
            "Error",
            `${key.replace(/([A-Z])/g, " $1").trim()} is required`
          );
          return;
        }
      }

      // Save to Firebase
      const businessesRef = collection(db, "businesses");
      await setDoc(doc(businessesRef, userId), {
        ...formData,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Show success message
      Alert.alert("Success", "Business registration completed successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Navigate to main app
            router.replace("/(home)");
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to save business information. Please try again."
      );
      console.error("Business registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.title}>Business Registration</ThemedText>
        <ThemedText style={styles.subtitle}>
          Please provide your business information to continue
        </ThemedText>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Business Name</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.businessName}
              onChangeText={(text) =>
                setFormData({ ...formData, businessName: text })
              }
              placeholder="Enter business name"
              placeholderTextColor={Colors.light.icon}
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Owner Full Name</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.ownerFullName}
              onChangeText={(text) =>
                setFormData({ ...formData, ownerFullName: text })
              }
              placeholder="Enter owner's full name"
              placeholderTextColor={Colors.light.icon}
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: "#f0f0f0" }]}
              value={formData.email}
              editable={false}
              placeholder="Email from your account"
              placeholderTextColor={Colors.light.icon}
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Phone Number</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              placeholderTextColor={Colors.light.icon}
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Physical Address</ThemedText>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={formData.physicalAddress}
              onChangeText={(text) =>
                setFormData({ ...formData, physicalAddress: text })
              }
              placeholder="Enter business address"
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.light.icon}
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>
              Business License Number
            </ThemedText>
            <TextInput
              style={styles.input}
              value={formData.businessLicense}
              onChangeText={(text) =>
                setFormData({ ...formData, businessLicense: text })
              }
              placeholder="Enter business license number"
              placeholderTextColor={Colors.light.icon}
            />
          </ThemedView>

          <ThemedView
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onTouchEnd={!isSubmitting ? handleSubmit : undefined}
          >
            <ThemedText style={styles.submitButtonText}>
              {isSubmitting ? "Registering..." : "Complete Registration"}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.light.tint,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: Colors.light.icon,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.light.icon,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
