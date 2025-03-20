import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Colors from "@/constants/Colors";
import questionData from "@/constants/data.json";

// Define question types
type QuestionType = "single_choice" | "multiple_choice" | "text";

interface Question {
  id: number;
  question: string;
  options: string[];
  type: QuestionType;
  dependency?: number;
}

export default function HealthQuestionnaireScreen() {
  const { userId, isSignedIn } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const questions = questionData.questions as Question[];

  useEffect(() => {
    // Calculate progress percentage
    setProgress((currentQuestionIndex / questions.length) * 100);
  }, [currentQuestionIndex, questions.length]);

  // Only show questions that don't have dependencies or whose dependencies are satisfied
  const shouldShowQuestion = (question: Question): boolean => {
    if (!question.dependency) return true;

    const dependentAnswer = answers[question.dependency];
    // If dependent question is a Yes/No and this is dependent on Yes
    if (Array.isArray(dependentAnswer)) {
      return dependentAnswer.includes("Yes");
    }
    return dependentAnswer === "Yes";
  };

  // Get the next visible question index
  const getNextVisibleQuestionIndex = (currentIndex: number): number => {
    for (let i = currentIndex + 1; i < questions.length; i++) {
      if (shouldShowQuestion(questions[i])) {
        return i;
      }
    }
    return questions.length; // If no more visible questions, return length to indicate completion
  };

  // Get the previous visible question index
  const getPreviousVisibleQuestionIndex = (currentIndex: number): number => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (shouldShowQuestion(questions[i])) {
        return i;
      }
    }
    return 0; // If no previous visible questions, stay at the first question
  };

  // Handle single choice selection
  const handleSingleChoice = (questionId: number, option: string) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  // Handle multiple choice selection
  const handleMultipleChoice = (questionId: number, option: string) => {
    const currentSelections = (answers[questionId] as string[]) || [];
    let newSelections: string[];

    if (currentSelections.includes(option)) {
      // If already selected, remove it
      newSelections = currentSelections.filter((item) => item !== option);
    } else {
      // If "None" is selected, clear other selections
      if (option === "None") {
        newSelections = ["None"];
      }
      // If selecting another option and "None" was previously selected, remove "None"
      else if (currentSelections.includes("None")) {
        newSelections = [option];
      }
      // Otherwise, add the new selection
      else {
        newSelections = [...currentSelections, option];
      }
    }

    setAnswers({ ...answers, [questionId]: newSelections });
  };

  // Handle text input
  const handleTextInput = (questionId: number, text: string) => {
    setAnswers({ ...answers, [questionId]: text });
  };

  // Handle next question
  const handleNext = () => {
    const nextIndex = getNextVisibleQuestionIndex(currentQuestionIndex);
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      handleSubmit();
    }
  };

  // Handle previous question
  const handlePrevious = () => {
    const prevIndex = getPreviousVisibleQuestionIndex(currentQuestionIndex);
    setCurrentQuestionIndex(prevIndex);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert("Error", "User not found. Please try signing in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save answers to Firestore
      await setDoc(doc(db, "userPreferences", userId), {
        dietaryPreferences: answers,
        completedAt: new Date().toISOString(),
      });

      // Navigate to the main app
      router.push("/(tabs)");
    } catch (error) {
      console.error("Error saving questionnaire:", error);
      Alert.alert(
        "Error",
        "Failed to save your preferences. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to tabs if already signed in
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Current question
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion =
    getNextVisibleQuestionIndex(currentQuestionIndex) >= questions.length;

  // Check if current question has an answer
  const getCurrentAnswer = () => {
    return answers[currentQuestion.id];
  };

  const isQuestionAnswered = () => {
    const answer = getCurrentAnswer();
    if (answer === undefined) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return answer.trim() !== "";
  };

  // Render options based on question type
  const renderOptions = () => {
    const questionId = currentQuestion.id;

    switch (currentQuestion.type) {
      case "single_choice":
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = answers[questionId] === option;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    isSelected && styles.selectedOption,
                  ]}
                  onPress={() => handleSingleChoice(questionId, option)}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText,
                    ]}
                  >
                    {option}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case "multiple_choice":
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const currentSelections = (answers[questionId] as string[]) || [];
              const isSelected = currentSelections.includes(option);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    isSelected && styles.selectedOption,
                  ]}
                  onPress={() => handleMultipleChoice(questionId, option)}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText,
                    ]}
                  >
                    {option}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case "text":
        // For simplicity, we're treating text type as single choice
        // In a real app, you would implement a TextInput component here
        return (
          <View style={styles.textInputContainer}>
            <ThemedText style={styles.textInputPrompt}>
              Please answer in the form fields (text inputs would be implemented
              here)
            </ThemedText>
            <TouchableOpacity
              style={styles.textInputButton}
              onPress={() =>
                handleTextInput(questionId, "Sample text response")
              }
            >
              <ThemedText style={styles.textInputButtonText}>
                Submit Response
              </ThemedText>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  if (isSubmitting) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>
          Saving your nutrition preferences...
        </ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Top header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Nutrition Profile</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Help us personalize your nutrition guidance
        </ThemedText>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.questionContainer}>
          {/* Question number */}
          <ThemedText style={styles.questionNumber}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </ThemedText>

          {/* Question text */}
          <ThemedText style={styles.questionText}>
            {currentQuestion.question}
          </ThemedText>

          {/* Options */}
          {renderOptions()}
        </View>
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, styles.backButton]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ThemedText
            style={[
              styles.navButtonText,
              currentQuestionIndex === 0 && styles.disabledButtonText,
            ]}
          >
            Back
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !isQuestionAnswered() && styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={!isQuestionAnswered()}
        >
          <ThemedText
            style={[
              styles.navButtonText,
              styles.nextButtonText,
              !isQuestionAnswered() && styles.disabledButtonText,
            ]}
          >
            {isLastQuestion ? "Finish" : "Next"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  progressContainer: {
    height: 6,
    backgroundColor: Colors.light.border,
    width: "100%",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.light.primary,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 80, // Space for navigation buttons
  },
  questionContainer: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20,
  },
  questionNumber: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 32,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedOption: {
    backgroundColor: Colors.light.primary + "20",
    borderColor: Colors.light.primary,
  },
  optionText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  selectedOptionText: {
    fontWeight: "600",
    color: Colors.light.primary,
  },
  textInputContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  textInputPrompt: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 20,
    textAlign: "center",
  },
  textInputButton: {
    backgroundColor: Colors.light.primary + "20",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  textInputButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  navigationContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  backButton: {
    backgroundColor: "transparent",
  },
  nextButton: {
    backgroundColor: Colors.light.primary,
    minWidth: 100,
    alignItems: "center",
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  nextButtonText: {
    color: "#FFFFFF",
  },
  disabledButton: {
    backgroundColor: Colors.light.border,
  },
  disabledButtonText: {
    color: Colors.light.textSecondary,
  },
});
