import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { router, useLocalSearchParams, Redirect } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { SafeAreaView } from "react-native";
import { CustomHeader } from "@/components/CustomHeader";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";

export default function BusinessRegistration() {
  const { user } = useUser();
  const { userId, getToken } = useAuth();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    businessName: "",
    ownerFullName: "",
    email: "",
    phone: "",
    physicalAddress: "",
    businessLicense: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if business is already registered
  useEffect(() => {
    const checkBusinessRegistration = async () => {
      if (!userId) return;

      try {
        const businessDoc = await getDoc(doc(db, "businesses", userId));
        if (businessDoc.exists()) {
          // Business already registered, redirect to main app
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Error checking business registration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkBusinessRegistration();
  }, [userId]);

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

  // Prevent unauthorized access
  if (!userId) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

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
            router.replace("/(tabs)");
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
    <SafeAreaView style={styles.container}>
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
              placeholderTextColor={Colors.light.textSecondary}
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
              placeholderTextColor={Colors.light.textSecondary}
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: "#f0f0f0" }]}
              value={formData.email}
              editable={false}
              placeholder="Email from your account"
              placeholderTextColor={Colors.light.textSecondary}
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
              placeholderTextColor={Colors.light.textSecondary}
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
              placeholderTextColor={Colors.light.textSecondary}
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
              placeholderTextColor={Colors.light.textSecondary}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    margin: 8,
    color: Colors.light.text,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    color: Colors.light.textSecondary,
  },
  form: {
    gap: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: Colors.light.text,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    shadowColor: Colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
