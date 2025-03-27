import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import Colors from "@/constants/Colors";
import { Picker } from "@react-native-picker/picker";

interface CalorieTargetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (target: number) => void;
}

export default function CalorieTargetModal({
  visible,
  onClose,
  onSave,
}: CalorieTargetModalProps) {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [activityLevel, setActivityLevel] = useState("sedentary");
  const [goal, setGoal] = useState("maintain");
  const [bmi, setBmi] = useState<number | null>(null);
  const [recommendedCalories, setRecommendedCalories] = useState<number | null>(
    null
  );

  const calculateBMI = () => {
    if (!weight || !height) return null;
    const heightInMeters = parseFloat(height) / 100;
    const bmiValue = parseFloat(weight) / (heightInMeters * heightInMeters);
    return Math.round(bmiValue * 10) / 10;
  };

  const calculateBMR = () => {
    if (!weight || !height || !age) return null;

    // Mifflin-St Jeor Equation
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);

    let bmr;
    if (gender === "male") {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }

    return Math.round(bmr);
  };

  const calculateTDEE = (bmr: number) => {
    const activityMultipliers = {
      sedentary: 1.2, // Little or no exercise
      light: 1.375, // Light exercise 1-3 days/week
      moderate: 1.55, // Moderate exercise 3-5 days/week
      active: 1.725, // Heavy exercise 6-7 days/week
      veryActive: 1.9, // Very heavy exercise, physical job
    };

    return Math.round(
      bmr *
        activityMultipliers[activityLevel as keyof typeof activityMultipliers]
    );
  };

  const calculateRecommendedCalories = () => {
    if (!weight || !height || !age) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    const bmr = calculateBMR();
    if (!bmr) return;

    const tdee = calculateTDEE(bmr);
    let recommended;

    switch (goal) {
      case "lose":
        recommended = tdee - 500; // 500 calorie deficit for weight loss
        break;
      case "gain":
        recommended = tdee + 500; // 500 calorie surplus for weight gain
        break;
      default:
        recommended = tdee; // Maintain weight
    }

    setRecommendedCalories(recommended);
    setBmi(calculateBMI());
  };

  const handleSave = () => {
    if (!recommendedCalories) {
      Alert.alert("Error", "Please calculate your recommended calories first");
      return;
    }
    onSave(recommendedCalories);
  };

  const getBMICategory = (bmiValue: number) => {
    if (bmiValue < 18.5) return "Underweight";
    if (bmiValue < 25) return "Normal weight";
    if (bmiValue < 30) return "Overweight";
    return "Obese";
  };

  const renderPicker = (
    value: string,
    onValueChange: (value: string) => void,
    items: { label: string; value: string }[]
  ) => {
    if (Platform.OS === "ios") {
      return (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            style={styles.picker}
          >
            {items.map((item) => (
              <Picker.Item
                key={item.value}
                label={item.label}
                value={item.value}
              />
            ))}
          </Picker>
        </View>
      );
    } else {
      return (
        <View style={styles.pickerContainerAndroid}>
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            style={styles.pickerAndroid}
            dropdownIconColor={Colors.light.text}
          >
            {items.map((item) => (
              <Picker.Item
                key={item.value}
                label={item.label}
                value={item.value}
                style={styles.pickerItemAndroid}
              />
            ))}
          </Picker>
        </View>
      );
    }
  };

  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];

  const activityOptions = [
    { label: "Sedentary (little or no exercise)", value: "sedentary" },
    { label: "Light (exercise 1-3 days/week)", value: "light" },
    { label: "Moderate (exercise 3-5 days/week)", value: "moderate" },
    { label: "Active (exercise 6-7 days/week)", value: "active" },
    { label: "Very Active (intense exercise daily)", value: "veryActive" },
  ];

  const goalOptions = [
    { label: "Maintain Weight", value: "maintain" },
    { label: "Lose Weight", value: "lose" },
    { label: "Gain Weight", value: "gain" },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.title}>Set Your Calorie Target</Text>
            <Text style={styles.subtitle}>
              Let's calculate your recommended daily calories
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              {renderPicker(
                gender,
                (value: string) => setGender(value),
                genderOptions
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age (years)</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="Enter your age"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="Enter your weight"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="Enter your height"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Activity Level</Text>
              {renderPicker(
                activityLevel,
                (value: string) => setActivityLevel(value),
                activityOptions
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal</Text>
              {renderPicker(
                goal,
                (value: string) => setGoal(value),
                goalOptions
              )}
            </View>

            <TouchableOpacity
              style={styles.calculateButton}
              onPress={calculateRecommendedCalories}
            >
              <Text style={styles.calculateButtonText}>Calculate</Text>
            </TouchableOpacity>

            {bmi !== null && recommendedCalories !== null && (
              <View style={styles.resultsContainer}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Your BMI</Text>
                  <Text style={styles.resultValue}>{bmi}</Text>
                  <Text style={styles.resultCategory}>
                    {getBMICategory(bmi)}
                  </Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>
                    Recommended Daily Calories
                  </Text>
                  <Text style={styles.resultValue}>{recommendedCalories}</Text>
                  <Text style={styles.resultCategory}>
                    Based on your{" "}
                    {goal === "maintain"
                      ? "maintenance"
                      : goal === "lose"
                      ? "weight loss"
                      : "weight gain"}{" "}
                    goal
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !recommendedCalories && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!recommendedCalories}
              >
                <Text style={styles.saveButtonText}>Save Target</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "90%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.light.background,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  pickerContainerAndroid: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.light.background,
  },
  pickerAndroid: {
    height: 50,
    width: "100%",
    color: Colors.light.text,
  },
  pickerItemAndroid: {
    fontSize: 16,
    color: Colors.light.text,
  },
  calculateButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 16,
  },
  calculateButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultItem: {
    marginBottom: 16,
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.primary,
    marginBottom: 4,
  },
  resultCategory: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: Colors.light.surface,
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: Colors.light.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: "600",
  },
});
