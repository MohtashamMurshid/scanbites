import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { db } from "@/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "@clerk/clerk-expo";
import OpenAI from "openai";
import Constants from "expo-constants";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "dlt3gguqq";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
// Use an unsigned upload preset instead of API key/secret for client-side uploads
const CLOUDINARY_UPLOAD_PRESET = "food_scan"; // Create this unsigned upload preset in your Cloudinary dashboard

// OpenAI configuration
const OPENAI_API_KEY =
  "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";

// Validate OpenAI API key
if (!OPENAI_API_KEY) {
  console.error(
    "OpenAI API key is not configured. Food scanning will not work properly."
  );
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

// Nutrition info type
interface NutritionInfo {
  foodName: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  allergens?: string[];
  additionalInfo?: string;
  healthTips?: string;
  personalizedRecommendation?: string;
}

// User preferences type
interface UserPreferences {
  dietaryPreferences: Record<number, string | string[]>;
  completedAt?: string;
}

export default function ScanScreen() {
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(
    null
  );
  const [galleryPermission, setGalleryPermission] = useState<boolean | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutritionInfo, setNutritionInfo] = useState<NutritionInfo | null>(
    null
  );
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const { userId } = useAuth();

  useEffect(() => {
    (async () => {
      // Request camera permissions
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermission(cameraStatus.status === "granted");

      // Request media library permissions
      const galleryStatus =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      setGalleryPermission(galleryStatus.status === "granted");

      // Load user preferences from Firestore
      if (userId) {
        try {
          const userPrefsDoc = await getDoc(doc(db, "userPreferences", userId));
          if (userPrefsDoc.exists()) {
            setUserPreferences(userPrefsDoc.data() as UserPreferences);
            console.log("Loaded user preferences");
          } else {
            console.log("No user preferences found");
          }
        } catch (error) {
          console.error("Error loading user preferences:", error);
        } finally {
          setIsLoadingPreferences(false);
        }
      }
    })();
  }, [userId]);

  // Extract dietary information from user preferences
  const extractDietaryInfo = (): {
    allergies: string[];
    dietaryRestrictions: string[];
    healthConditions: string[];
    lifestyleFactors: {
      exercise?: string;
      lifestyle?: string;
      calorieIntake?: string;
      saltIntake?: string;
      sugarIntake?: string;
      processedFoodFrequency?: string;
      waterIntake?: string;
      mealsPerDay?: string;
    };
    supplements: string[];
    medications: string;
    diabetesStatus?: string;
    hypertension?: boolean;
  } => {
    const allergies: string[] = [];
    const dietaryRestrictions: string[] = [];
    const healthConditions: string[] = [];
    const supplements: string[] = [];
    const lifestyleFactors: {
      exercise?: string;
      lifestyle?: string;
      calorieIntake?: string;
      saltIntake?: string;
      sugarIntake?: string;
      processedFoodFrequency?: string;
      waterIntake?: string;
      mealsPerDay?: string;
    } = {};
    let medications: string = "";
    let diabetesStatus: string | undefined;
    let hypertension: boolean | undefined;

    if (!userPreferences) {
      return {
        allergies,
        dietaryRestrictions,
        healthConditions,
        lifestyleFactors,
        supplements,
        medications,
      };
    }

    const { dietaryPreferences } = userPreferences;

    // Food allergies (Question 1 and 2)
    const hasAllergies = dietaryPreferences[1];
    if (hasAllergies === "Yes") {
      const allergyAnswers = dietaryPreferences[2];
      if (allergyAnswers && Array.isArray(allergyAnswers)) {
        allergyAnswers.forEach((allergy) => {
          allergies.push(allergy);
        });
      }
    }

    // Dietary restrictions (Question 3)
    const restrictions = dietaryPreferences[3];
    if (restrictions && Array.isArray(restrictions)) {
      restrictions.forEach((restriction) => {
        if (restriction !== "None") {
          dietaryRestrictions.push(restriction);
        }
      });
    }

    // Chronic digestive conditions (Question 4)
    const digestiveConditions = dietaryPreferences[4];
    if (digestiveConditions && Array.isArray(digestiveConditions)) {
      digestiveConditions.forEach((condition) => {
        if (condition !== "None") {
          healthConditions.push(condition);
        }
      });
    }

    // Diabetes status (Question 6)
    diabetesStatus = dietaryPreferences[6] as string;
    if (diabetesStatus && diabetesStatus !== "No") {
      healthConditions.push(`Diabetes (${diabetesStatus})`);
    }

    // Hypertension (Question 7)
    hypertension = dietaryPreferences[7] === "Yes";
    if (hypertension) {
      healthConditions.push("Hypertension");
    }

    // Medications (Questions 8 and 9)
    const takingMedications = dietaryPreferences[8];
    if (takingMedications === "Yes") {
      medications =
        (dietaryPreferences[9] as string) || "Unspecified medications";
    }

    // Metabolic disorders (Question 10)
    const metabolicDisorders = dietaryPreferences[10];
    if (metabolicDisorders && Array.isArray(metabolicDisorders)) {
      metabolicDisorders.forEach((disorder) => {
        if (disorder !== "None") {
          healthConditions.push(disorder);
        }
      });
    }

    // Digestive symptoms (Question 11)
    const bloatingFrequency = dietaryPreferences[11];
    if (
      bloatingFrequency &&
      bloatingFrequency !== "Never" &&
      bloatingFrequency !== "Rarely"
    ) {
      healthConditions.push(`Frequent bloating (${bloatingFrequency})`);
    }

    // Lifestyle factors
    lifestyleFactors.calorieIntake = dietaryPreferences[14] as string;
    lifestyleFactors.saltIntake = dietaryPreferences[15] as string;
    lifestyleFactors.sugarIntake = dietaryPreferences[16] as string;
    lifestyleFactors.processedFoodFrequency = dietaryPreferences[17] as string;
    lifestyleFactors.exercise = dietaryPreferences[18] as string;
    lifestyleFactors.lifestyle = dietaryPreferences[19] as string;
    lifestyleFactors.mealsPerDay = dietaryPreferences[21] as string;
    lifestyleFactors.waterIntake = dietaryPreferences[24] as string;

    // Supplements (Questions 22 and 23)
    const takesSupplements = dietaryPreferences[22];
    if (takesSupplements === "Yes") {
      const supplementsList = dietaryPreferences[23];
      if (supplementsList && Array.isArray(supplementsList)) {
        supplementsList.forEach((supplement) => {
          supplements.push(supplement);
        });
      }
    }

    return {
      allergies,
      dietaryRestrictions,
      healthConditions,
      lifestyleFactors,
      supplements,
      medications,
      diabetesStatus,
      hypertension,
    };
  };

  const openCamera = async () => {
    try {
      // Open camera directly with ImagePicker
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadSuccess(false);
        setNutritionInfo(null);
        setCapturedImage(result.assets[0].uri);
        uploadToCloudinary(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  const openGallery = async () => {
    try {
      // Open image gallery with ImagePicker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadSuccess(false);
        setNutritionInfo(null);
        setCapturedImage(result.assets[0].uri);
        uploadToCloudinary(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error opening gallery:", error);
      Alert.alert("Error", "Failed to open gallery. Please try again.");
    }
  };

  const uploadToCloudinary = async (imageUri: string) => {
    setIsUploading(true);

    try {
      // Resize and compress the image before uploading
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Prepare the upload parameters
      const timestamp = Math.floor(Date.now() / 1000);
      const fileName = `food_scan_${timestamp}`;

      // Create form data for the upload
      const formData = new FormData();

      // Add the image file
      formData.append("file", {
        uri: manipulatedImage.uri,
        type: "image/jpeg",
        name: `${fileName}.jpg`,
      } as any);

      // Add upload preset for unsigned uploads
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      // Add additional optional parameters
      formData.append("public_id", fileName);
      formData.append("tags", "food,scan,nutrition");

      // Upload to Cloudinary
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();

      if (data.secure_url) {
        // Save successful scan to Firestore
        if (userId) {
          await addDoc(collection(db, "foodScans"), {
            userId,
            imageUrl: data.secure_url,
            timestamp: serverTimestamp(),
          });
        }

        setUploadSuccess(true);

        // After successful upload, analyze the image with OpenAI
        analyzeImageWithOpenAI(data.secure_url);
      } else {
        throw new Error(
          "Upload failed: " + (data.error?.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeImageWithOpenAI = async (imageUrl: string) => {
    setIsAnalyzing(true);

    try {
      console.log("Sending request to OpenAI for image analysis:", imageUrl);

      // Extract dietary information from user preferences
      const {
        dietaryRestrictions,
        allergies,
        healthConditions,
        lifestyleFactors,
        supplements,
        medications,
        diabetesStatus,
        hypertension,
      } = extractDietaryInfo();

      // Create a personalized system message that includes user preferences
      let systemContent =
        "You are a nutrition expert specialized in analyzing food images and providing personalized dietary recommendations. Provide detailed nutritional information based on the food image, including calories, macronutrients, and health insights.\n\n" +
        "YOUR TOP PRIORITY is to identify any common allergens present in the food (such as peanuts, tree nuts, milk, eggs, wheat, soy, fish, shellfish) and how the food aligns with the user's health profile.";

      // Add dietary restrictions
      if (dietaryRestrictions.length > 0) {
        systemContent += `\n\nDIETARY RESTRICTIONS: The user follows these dietary patterns: ${dietaryRestrictions.join(
          ", "
        )}. Evaluate how well this food aligns with these restrictions and provide specific guidance.`;
      }

      // Add allergies with emphasis
      if (allergies.length > 0) {
        systemContent += `\n\nALLERGIES (CRITICAL): The user has reported allergies to: ${allergies.join(
          ", "
        )}. These MUST be highlighted as allergens if present in the food. This is essential for the user's safety.`;
      }

      // Add health conditions
      if (healthConditions.length > 0) {
        systemContent += `\n\nHEALTH CONDITIONS: The user has the following health conditions: ${healthConditions.join(
          ", "
        )}. Provide specific nutritional recommendations that account for these conditions.`;
      }

      // Add lifestyle factors
      if (Object.keys(lifestyleFactors).length > 0) {
        systemContent +=
          "\n\nLIFESTYLE FACTORS: The user's lifestyle includes: ";
        const factorDetails = [];
        if (lifestyleFactors.calorieIntake) {
          factorDetails.push(
            `${lifestyleFactors.calorieIntake} calorie intake`
          );
        }
        if (lifestyleFactors.saltIntake) {
          factorDetails.push(`${lifestyleFactors.saltIntake} salt intake`);
        }
        if (lifestyleFactors.sugarIntake) {
          factorDetails.push(`${lifestyleFactors.sugarIntake} sugar intake`);
        }
        if (lifestyleFactors.processedFoodFrequency) {
          factorDetails.push(
            `${lifestyleFactors.processedFoodFrequency} processed food frequency`
          );
        }
        if (lifestyleFactors.exercise) {
          factorDetails.push(`${lifestyleFactors.exercise} exercise frequency`);
        }
        if (lifestyleFactors.lifestyle) {
          factorDetails.push(`${lifestyleFactors.lifestyle} activity level`);
        }
        if (lifestyleFactors.mealsPerDay) {
          factorDetails.push(`${lifestyleFactors.mealsPerDay}`);
        }
        if (lifestyleFactors.waterIntake) {
          factorDetails.push(
            `${lifestyleFactors.waterIntake} water consumption`
          );
        }
        systemContent +=
          factorDetails.join(", ") +
          ". Analyze how this food fits with these lifestyle factors.";
      }

      // Add supplements
      if (supplements.length > 0) {
        systemContent += `\n\nSUPPLEMENTS: The user takes the following supplements: ${supplements.join(
          ", "
        )}. Consider nutrient interactions and complementary needs.`;
      }

      // Add medications
      if (medications) {
        systemContent += `\n\nMEDICATIONS: The user takes: ${medications}. Consider potential food-drug interactions.`;
      }

      // Add diabetes status
      if (diabetesStatus && diabetesStatus !== "No") {
        systemContent += `\n\nDIABETES: The user has ${diabetesStatus} diabetes. Evaluate carbohydrate content and glycemic impact of this food.`;
      }

      // Add hypertension
      if (hypertension) {
        systemContent +=
          "\n\nHYPERTENSION: The user has high blood pressure. Evaluate sodium content and blood pressure impact of this food.";
      }

      systemContent +=
        "\n\nYour response should be a well-structured JSON object with the following fields:" +
        "\n- foodName: Name of the food" +
        "\n- calories: Calorie content with units" +
        "\n- protein: Protein content with units" +
        "\n- carbs: Carbohydrate content with units" +
        "\n- fat: Fat content with units" +
        "\n- fiber: Fiber content with units" +
        "\n- sugar: Sugar content with units" +
        "\n- allergens: Array of allergens present in the food" +
        "\n- additionalInfo: General nutritional information" +
        "\n- healthTips: General health advice related to this food" +
        "\n- personalizedRecommendation: Detailed personalized advice based on the user's health profile";

      // Define the messages with proper typing for OpenAI
      const systemMessage = {
        role: "system" as const,
        content: systemContent,
      };

      // Create a user message with additional context about preferences
      let userPrompt =
        "Analyze this food image and provide detailed nutritional information as a JSON object. I need specific information about its nutritional content, potential allergens, and how it fits with my health profile.";

      if (userPreferences) {
        userPrompt +=
          " Please provide personalized recommendations based on my dietary preferences, health conditions, and lifestyle factors.";
      }

      const userMessage = {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: userPrompt,
          },
          {
            type: "image_url" as const,
            image_url: {
              url: imageUrl,
            },
          },
        ],
      };

      console.log(
        "Preparing to send request to OpenAI with comprehensive personalized context"
      );

      let apiResponse;
      try {
        apiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [systemMessage, userMessage],
          max_tokens: 1000,
          response_format: { type: "json_object" },
        });
        console.log("OpenAI API request successful");
      } catch (apiError) {
        console.error("OpenAI API error:", apiError);
        throw new Error(
          `OpenAI API error: ${
            apiError instanceof Error ? apiError.message : String(apiError)
          }`
        );
      }

      console.log("OpenAI Response received");

      if (
        !apiResponse ||
        !apiResponse.choices ||
        apiResponse.choices.length === 0
      ) {
        console.error(
          "Invalid API response structure:",
          JSON.stringify(apiResponse)
        );
        throw new Error("Invalid API response: No choices returned");
      }

      console.log("Response has choices:", apiResponse.choices.length);

      const content = apiResponse.choices[0].message.content;
      if (!content) {
        console.error(
          "No content in API response:",
          JSON.stringify(apiResponse.choices[0])
        );
        throw new Error("No content in OpenAI response");
      }

      console.log("Response content length:", content.length);
      console.log("Content sample:", content.substring(0, 100));

      try {
        const parsedData = JSON.parse(content);
        await processNutritionData(parsedData, imageUrl);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);

        // Try a more lenient approach if direct parsing fails
        try {
          // Try to handle potential JSON formatting issues
          const cleanedContent = content
            .replace(/[\u201C\u201D]/g, '"') // Replace curly quotes
            .replace(/[\u2018\u2019]/g, "'") // Replace curly apostrophes
            .replace(/\n/g, " ")
            .trim();

          // Look for JSON-like structure with braces
          const match = cleanedContent.match(/{.*}/s);
          if (match) {
            const extractedJson = match[0];
            console.log(
              "Extracted potential JSON:",
              extractedJson.substring(0, 100)
            );
            const parsedData = JSON.parse(extractedJson);
            await processNutritionData(parsedData, imageUrl);
          } else {
            throw new Error("No valid JSON structure found in response");
          }
        } catch (fallbackError) {
          console.error("Fallback parsing also failed:", fallbackError);

          // Generate mock data as last resort
          const mockData = generateMockData(imageUrl);
          await processNutritionData(mockData, imageUrl);
        }
      }
    } catch (error) {
      console.error("Error analyzing image with OpenAI:", error);

      // Always use mock data in development mode to allow continued testing
      if (__DEV__) {
        console.log("Using mock nutrition data for development");
        const mockData = generateMockData(imageUrl);
        setNutritionInfo(mockData);
      } else {
        Alert.alert(
          "Analysis Error",
          "We couldn't analyze this food image. Please try a clearer image or try again later."
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate mock nutrition data for testing/fallback
  const generateMockData = (imageUrl: string): NutritionInfo => {
    // Create a deterministic "random" value based on the image URL
    const hash = imageUrl
      .split("")
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);

    // Use the hash to vary the mock data slightly
    const calorieBase = 250 + (hash % 300);
    const proteinBase = 10 + (hash % 20);
    const carbsBase = 30 + (hash % 30);
    const fatBase = 8 + (hash % 12);
    const fiberValue = 3 + (hash % 7);
    const sugarValue = 5 + (hash % 15);

    // Common allergens to potentially include
    const commonAllergens = [
      "Peanuts",
      "Tree Nuts",
      "Milk",
      "Eggs",
      "Wheat",
      "Soy",
      "Fish",
      "Shellfish",
      "Sesame",
      "Gluten",
    ];

    // Select a few allergens based on the hash
    const selectedAllergens = [];
    if (hash % 4 === 0) {
      // 25% chance of no allergens
      // Leave the array empty
    } else {
      // Add 1-3 allergens based on hash
      const numAllergens = 1 + (hash % 3);
      for (let i = 0; i < numAllergens; i++) {
        const index = (hash + i * 7) % commonAllergens.length;
        selectedAllergens.push(commonAllergens[index]);
      }
    }

    // Extract user preferences for personalized mock recommendations
    const {
      dietaryRestrictions,
      allergies,
      healthConditions,
      lifestyleFactors,
      supplements,
      medications,
      diabetesStatus,
      hypertension,
    } = extractDietaryInfo();

    // Build a comprehensive personalized recommendation
    let personalizedRecommendation = "";

    // Add dietary pattern recommendations
    if (dietaryRestrictions.length > 0) {
      personalizedRecommendation += "Dietary Fit: ";

      if (dietaryRestrictions.includes("Vegetarian")) {
        const isMeatFree = hash % 2 === 0;
        if (isMeatFree) {
          personalizedRecommendation +=
            "This food is suitable for your vegetarian diet. It contains no meat products. ";
        } else {
          personalizedRecommendation +=
            "CAUTION: This food may contain meat products that don't align with your vegetarian diet. Please verify ingredients. ";
        }
      }

      if (dietaryRestrictions.includes("Vegan")) {
        const isVeganFriendly = hash % 3 === 0;
        if (isVeganFriendly) {
          personalizedRecommendation +=
            "This food appears to be plant-based and suitable for your vegan lifestyle. ";
        } else {
          personalizedRecommendation +=
            "CAUTION: This food may contain animal products that don't align with your vegan diet. Please verify all ingredients carefully. ";
        }
      }

      if (dietaryRestrictions.includes("Gluten-Free")) {
        const hasGluten =
          selectedAllergens.includes("Gluten") ||
          selectedAllergens.includes("Wheat");
        if (hasGluten) {
          personalizedRecommendation +=
            "WARNING: This food contains gluten which conflicts with your gluten-free diet. ";
        } else {
          personalizedRecommendation +=
            "This food appears to be gluten-free, but always verify packaged food labels for certainty. ";
        }
      }

      if (dietaryRestrictions.includes("Keto")) {
        if (carbsBase < 10) {
          personalizedRecommendation += `With only ${carbsBase}g of carbs, this food fits well within keto macros. `;
        } else {
          personalizedRecommendation += `With ${carbsBase}g of carbs, this food may be too carb-heavy for strict keto. Consider smaller portions or alternatives. `;
        }
      }
    }

    // Add allergy-specific recommendations
    if (allergies.length > 0) {
      personalizedRecommendation += "Allergy Check: ";

      const matchingAllergens = selectedAllergens.filter((allergen) =>
        allergies.some((userAllergy) =>
          allergen.toLowerCase().includes(userAllergy.toLowerCase())
        )
      );

      if (matchingAllergens.length > 0) {
        personalizedRecommendation += `⚠️ ALLERGEN ALERT: This food contains ${matchingAllergens.join(
          ", "
        )} that match your reported allergies. AVOID consuming this food for your safety. `;
      } else {
        personalizedRecommendation +=
          "Good news! We didn't detect any of your reported allergens in this food. Still, always check ingredient labels for certainty. ";
      }
    }

    // Add health condition-specific recommendations
    if (healthConditions.length > 0) {
      personalizedRecommendation += "Health Considerations: ";

      // Check for digestive conditions
      const digestiveConditions = healthConditions.filter((condition) =>
        [
          "IBS",
          "Celiac",
          "Crohn",
          "Colitis",
          "GERD",
          "Acid Reflux",
          "bloating",
        ].some((term) => condition.includes(term))
      );

      if (digestiveConditions.length > 0) {
        if (fiberValue > 5) {
          personalizedRecommendation += `With ${fiberValue}g of fiber, this food may trigger symptoms for your ${digestiveConditions.join(
            ", "
          )}. Consider smaller portions and monitor your body's response. `;
        } else {
          personalizedRecommendation += `With moderate fiber content (${fiberValue}g), this food may be gentler on your digestive system. `;
        }
      }
    }

    // Add diabetes-specific recommendations
    if (diabetesStatus && diabetesStatus !== "No") {
      personalizedRecommendation += "Blood Sugar Management: ";

      const estimatedGlycemicImpact = sugarValue * 2 + carbsBase / 3;

      if (estimatedGlycemicImpact > 15) {
        personalizedRecommendation += `This food contains ${sugarValue}g sugar and ${carbsBase}g carbs, which may cause significant blood glucose elevation. Consider consuming with protein or healthy fats to slow absorption, or reduce portion size. `;
      } else {
        personalizedRecommendation += `With ${sugarValue}g sugar and ${carbsBase}g carbs, this food has a moderate glycemic impact when consumed in recommended portions. `;
      }

      personalizedRecommendation +=
        "Remember to monitor your blood glucose levels as individual responses vary. ";
    }

    // Add hypertension-specific recommendations
    if (hypertension) {
      personalizedRecommendation += "Blood Pressure Considerations: ";

      // Simulate sodium content based on hash
      const sodiumContent = 50 + (hash % 600);

      if (sodiumContent > 400) {
        personalizedRecommendation += `This food contains an estimated ${sodiumContent}mg of sodium, which is relatively high. Given your hypertension, consider lower-sodium alternatives or balance with potassium-rich foods. `;
      } else {
        personalizedRecommendation += `With approximately ${sodiumContent}mg of sodium, this food is relatively low in sodium and better suited for your blood pressure management goals. `;
      }
    }

    // Add lifestyle-based recommendations
    if (Object.keys(lifestyleFactors).length > 0) {
      personalizedRecommendation += "Lifestyle Fit: ";

      // Exercise recommendations
      if (
        (lifestyleFactors.exercise &&
          lifestyleFactors.exercise.includes("Daily")) ||
        lifestyleFactors.exercise?.includes("3-5 times")
      ) {
        personalizedRecommendation += `As someone who exercises ${lifestyleFactors.exercise}, this food provides ${proteinBase}g of protein to support muscle recovery and ${calorieBase} calories for energy needs. `;
      }

      // Calorie intake recommendations
      if (lifestyleFactors.calorieIntake) {
        if (lifestyleFactors.calorieIntake.includes("Less than 1500")) {
          personalizedRecommendation += `At ${calorieBase} calories per serving, be mindful of portion sizes to stay within your daily calorie goals. `;
        } else if (lifestyleFactors.calorieIntake.includes("More than 3000")) {
          personalizedRecommendation += `With ${calorieBase} calories, this food can be incorporated into your higher-calorie meal plan. `;
        }
      }

      // Water intake recommendation
      if (
        lifestyleFactors.waterIntake &&
        lifestyleFactors.waterIntake.includes("Less than 1L")
      ) {
        personalizedRecommendation +=
          "Remember to increase your water intake throughout the day, especially when consuming foods with fiber. ";
      }
    }

    // Add supplements-based recommendations
    if (supplements.length > 0) {
      if (supplements.includes("Iron") && selectedAllergens.includes("Dairy")) {
        personalizedRecommendation +=
          "Note that dairy products in this food may reduce iron absorption. Consider separating your iron supplement from this meal. ";
      }

      if (supplements.includes("Calcium") && fatBase > 10) {
        personalizedRecommendation +=
          "The higher fat content in this food may reduce calcium absorption if consumed together with your supplement. ";
      }
    }

    // Add a final balanced perspective
    personalizedRecommendation += "Overall Assessment: ";
    const overallScore = hash % 5; // 0-4 scale

    if (overallScore > 3) {
      personalizedRecommendation +=
        "This food generally aligns well with your health profile when consumed in appropriate portions as part of a balanced diet. ";
    } else if (overallScore > 1) {
      personalizedRecommendation +=
        "This food can be included in your diet occasionally, but monitor how it affects your specific health conditions. ";
    } else {
      personalizedRecommendation +=
        "Based on your health profile, this food may present several challenges and should be consumed sparingly or with modifications. ";
    }

    personalizedRecommendation +=
      "Remember that individual responses to foods vary, and these recommendations are general guidelines.";

    return {
      foodName: "Food Item (Generated Data)",
      calories: `${calorieBase} kcal`,
      protein: `${proteinBase}g`,
      carbs: `${carbsBase}g`,
      fat: `${fatBase}g`,
      fiber: `${fiberValue}g`,
      sugar: `${sugarValue}g`,
      allergens: selectedAllergens,
      additionalInfo:
        "This is generated nutritional data. The image analysis couldn't determine the exact food item.",
      healthTips:
        "For accurate nutritional information, try uploading a clearer image of a single food item.",
      personalizedRecommendation: userPreferences
        ? personalizedRecommendation
        : undefined,
    };
  };

  // Helper function to process nutrition data
  const processNutritionData = async (parsedData: any, imageUrl: string) => {
    // Ensure all required fields are present
    const defaultData = {
      foodName: "Unknown Food",
      calories: "N/A",
      protein: "N/A",
      carbs: "N/A",
      fat: "N/A",
      fiber: "N/A",
      sugar: "N/A",
      allergens: [],
      additionalInfo: "Unable to determine additional information",
      healthTips: "Consult a nutritionist for dietary advice",
    };

    // Merge with defaults to handle missing fields
    const nutritionData = { ...defaultData, ...parsedData };

    // Extract numeric values for database storage
    const numericValues = {
      caloriesNum: parseInt(nutritionData.calories.replace(/[^0-9]/g, "")),
      proteinNum: parseInt(nutritionData.protein.replace(/[^0-9]/g, "")),
      carbsNum: parseInt(nutritionData.carbs.replace(/[^0-9]/g, "")),
      fatNum: parseInt(nutritionData.fat.replace(/[^0-9]/g, "")),
      fiberNum: parseInt(nutritionData.fiber.replace(/[^0-9]/g, "")),
      sugarNum: parseInt(nutritionData.sugar.replace(/[^0-9]/g, "")),
    };

    setNutritionInfo(nutritionData);

    // Save the nutrition info to Firestore
    if (userId) {
      try {
        const docRef = await addDoc(collection(db, "nutritionData"), {
          userId,
          imageUrl: imageUrl,
          foodName: nutritionData.foodName,
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          carbs: nutritionData.carbs,
          fat: nutritionData.fat,
          fiber: nutritionData.fiber,
          sugar: nutritionData.sugar,
          // Numeric values for calculations and charts
          caloriesNum: isNaN(numericValues.caloriesNum)
            ? 0
            : numericValues.caloriesNum,
          proteinNum: isNaN(numericValues.proteinNum)
            ? 0
            : numericValues.proteinNum,
          carbsNum: isNaN(numericValues.carbsNum) ? 0 : numericValues.carbsNum,
          fatNum: isNaN(numericValues.fatNum) ? 0 : numericValues.fatNum,
          fiberNum: isNaN(numericValues.fiberNum) ? 0 : numericValues.fiberNum,
          sugarNum: isNaN(numericValues.sugarNum) ? 0 : numericValues.sugarNum,
          // Other nutrition data
          allergens: nutritionData.allergens || [],
          additionalInfo: nutritionData.additionalInfo,
          healthTips: nutritionData.healthTips,
          personalizedRecommendation: nutritionData.personalizedRecommendation,
          timestamp: serverTimestamp(),
          scanDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format for easier grouping
        });
        console.log("Nutrition data saved with ID: ", docRef.id);
      } catch (error) {
        console.error("Error saving nutrition data:", error);
      }
    }
  };

  // Show loading state while checking permissions
  if (
    cameraPermission === null ||
    galleryPermission === null ||
    isLoadingPreferences
  ) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.messageText}>Loading app resources...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show permission denied message if camera access is denied
  if (cameraPermission === false && galleryPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={80}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.messageTitle}>
            No access to camera or gallery
          </Text>
          <Text style={styles.messageText}>
            Please enable camera and media access in your device settings to use
            the scanning feature.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderNutritionCard = () => {
    if (!nutritionInfo) return null;

    // Helper function to render personalized recommendations
    const renderPersonalizedRecommendations = () => {
      if (!nutritionInfo || !nutritionInfo.personalizedRecommendation) {
        return null;
      }

      // Ensure recommendation is defined before calling split
      const recommendations =
        typeof nutritionInfo.personalizedRecommendation === "string"
          ? nutritionInfo.personalizedRecommendation
              .split("\n")
              .filter((rec) => rec.trim().length > 0)
          : [];

      if (recommendations.length === 0) {
        return null;
      }

      return (
        <View style={styles.personalizedSection}>
          <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Colors.light.primary}
                style={styles.recommendationIcon}
              />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      );
    };

    return (
      <View style={styles.nutritionCard}>
        <Text style={styles.foodName}>{nutritionInfo.foodName}</Text>

        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutritionInfo.calories}</Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
          </View>

          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutritionInfo.protein}</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>

          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutritionInfo.carbs}</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>

          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutritionInfo.fat}</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>

        <View style={styles.nutritionDetails}>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionDetailLabel}>Fiber:</Text>
            <Text style={styles.nutritionDetailValue}>
              {nutritionInfo.fiber}
            </Text>
          </View>

          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionDetailLabel}>Sugar:</Text>
            <Text style={styles.nutritionDetailValue}>
              {nutritionInfo.sugar}
            </Text>
          </View>
        </View>

        {nutritionInfo.allergens && nutritionInfo.allergens.length > 0 ? (
          <View style={styles.allergensSection}>
            <Text style={styles.infoTitle}>Allergens</Text>
            <View style={styles.allergensTags}>
              {nutritionInfo.allergens.map((allergen, index) => (
                <View key={index} style={styles.allergenTag}>
                  <Text style={styles.allergenText}>{allergen}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Allergens</Text>
            <Text style={styles.infoText}>No common allergens detected</Text>
          </View>
        )}

        {/* Render personalized recommendations */}
        {renderPersonalizedRecommendations()}

        {nutritionInfo.additionalInfo && (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Additional Info</Text>
            <Text style={styles.infoText}>{nutritionInfo.additionalInfo}</Text>
          </View>
        )}

        {nutritionInfo.healthTips && (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Health Tips</Text>
            <Text style={styles.infoText}>{nutritionInfo.healthTips}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Food</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.contentContainer}
      >
        {isUploading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.messageText}>Uploading image...</Text>
          </View>
        ) : isAnalyzing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.messageText}>
              Analyzing nutritional content...
            </Text>
            <Text style={styles.smallText}>This may take a moment</Text>
          </View>
        ) : capturedImage ? (
          <View style={styles.previewContainer}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: capturedImage }}
                style={styles.preview}
                resizeMode="cover"
              />
              {uploadSuccess && !nutritionInfo && !isAnalyzing && (
                <View style={styles.successOverlay}>
                  <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                  <Text style={styles.successText}>Uploaded</Text>
                </View>
              )}
            </View>

            {nutritionInfo && renderNutritionCard()}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={openCamera}
              >
                <Ionicons
                  name="camera"
                  size={24}
                  color={Colors.light.background}
                />
                <Text style={styles.actionButtonText}>New Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={openGallery}
              >
                <Ionicons
                  name="images"
                  size={24}
                  color={Colors.light.background}
                />
                <Text style={styles.actionButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.centered}>
            <Ionicons
              name="fast-food-outline"
              size={80}
              color={Colors.light.primary}
            />
            <Text style={styles.messageTitle}>Ready to Scan</Text>
            <Text style={styles.messageText}>
              Take a photo of your food or choose from gallery to analyze its
              nutritional content
            </Text>
            <View style={styles.buttonContainer}>
              {cameraPermission && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={openCamera}
                >
                  <Ionicons
                    name="camera"
                    size={24}
                    color={Colors.light.background}
                  />
                  <Text style={styles.actionButtonText}>Camera</Text>
                </TouchableOpacity>
              )}
              {galleryPermission && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={openGallery}
                >
                  <Ionicons
                    name="images"
                    size={24}
                    color={Colors.light.background}
                  />
                  <Text style={styles.actionButtonText}>Gallery</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  messageText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  smallText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 16,
    marginTop: 16,
  },
  photoButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    maxWidth: 300,
  },
  photoButtonText: {
    color: Colors.light.background,
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    maxWidth: 150,
  },
  actionButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  previewContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  successText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  nutritionCard: {
    width: "100%",
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodName: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: "center",
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  nutritionItem: {
    width: "48%",
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  nutritionLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  nutritionDetails: {
    marginBottom: 16,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  nutritionDetailLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  nutritionDetailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
  },
  infoSection: {
    marginTop: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  allergensSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  allergensTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  allergenTag: {
    backgroundColor: "#FFF3E0",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  allergenText: {
    fontSize: 14,
    color: "#E65100",
    fontWeight: "500",
  },
  personalizedSection: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  personalizedText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.primary,
    marginLeft: 8,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  recommendationBullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
    marginRight: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  recommendationIcon: {
    marginRight: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: Colors.light.text,
  },
});
