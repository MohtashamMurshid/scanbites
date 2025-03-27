import React, { useState } from "react";
import {
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
import { useRouter } from "expo-router";
import { Stack } from "expo-router";

export default function CalorieTargetScreen() {
  const router = useRouter();
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
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
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
        recommended = tdee - 500;
        break;
      case "gain":
        recommended = tdee + 500;
        break;
      default:
        recommended = tdee;
    }

    setRecommendedCalories(recommended);
    setBmi(calculateBMI());
  };

  const handleSave = () => {
    if (!recommendedCalories) {
      Alert.alert("Error", "Please calculate your recommended calories first");
      return;
    }
    router.push({
      pathname: "/",
      params: { calorieTarget: recommendedCalories },
    });
  };

  const getBMICategory = (bmiValue: number) => {
    if (bmiValue < 18.5) return "Underweight";
    if (bmiValue < 25) return "Normal weight";
    if (bmiValue < 30) return "Overweight";
    return "Obese";
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

  const renderPickerItems = (items: { label: string; value: string }[]) => {
    return items.map((item) => (
      <Picker.Item
        key={item.value}
        label={item.label}
        value={item.value}
        color={Colors.light.text}
      />
    ));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Set Calorie Target",
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.title}>Set Your Calorie Target</Text>
          <Text style={styles.subtitle}>
            Let's calculate your recommended daily calories
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={gender}
                onValueChange={(value) => setGender(value)}
                style={styles.picker}
                itemStyle={{ height: 48, fontSize: 16 }}
              >
                {renderPickerItems(genderOptions)}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age (years)</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="Enter your age"
              placeholderTextColor={Colors.light.textSecondary}
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
              placeholderTextColor={Colors.light.textSecondary}
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
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={activityLevel}
                onValueChange={(value) => setActivityLevel(value)}
                style={styles.picker}
                itemStyle={{ height: 48, fontSize: 16 }}
              >
                {renderPickerItems(activityOptions)}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={goal}
                onValueChange={(value) => setGoal(value)}
                style={styles.picker}
                itemStyle={{ height: 48, fontSize: 16 }}
              >
                {renderPickerItems(goalOptions)}
              </Picker>
            </View>
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
                <Text style={styles.resultCategory}>{getBMICategory(bmi)}</Text>
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
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
    padding: 20,
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
    color: Colors.light.text,
    height: 48,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    overflow: "hidden",
    height: 48,
  },
  picker: {
    width: "100%",
    color: Colors.light.text,
    height: 48,
  },
  pickerIOS: {
    height: 48,
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
    marginBottom: 20,
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
