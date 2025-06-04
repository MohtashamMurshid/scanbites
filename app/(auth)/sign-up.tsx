import * as React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Colors from "@/constants/Colors";
import { CustomHeader } from "@/components/CustomHeader";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    // 1. Front‐end validation: ensure both fields are filled
    if (!emailAddress.trim() || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    try {
      // 2. Attempt to create the user
      await signUp.create({
        emailAddress,
        password,
      });

      // 3. Prepare email‐code verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      // 4. Gather all Clerk errors (if available) or show fallback
      const messages: string[] = [];

      if (Array.isArray(err.errors)) {
        for (const e of err.errors) {
          if (e.longMessage) {
            messages.push(e.longMessage);
          } else if (e.message) {
            messages.push(e.message);
          }
        }
      }

      if (messages.length === 0 && err.message) {
        messages.push(err.message);
      }

      if (messages.length === 0) {
        messages.push("Failed to create account. Please try again.");
      }

      Alert.alert("Sign-Up Error", messages.join("\n"));
      console.error("Clerk SignUp Error:", JSON.stringify(err, null, 2));
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    // 1. Ensure user entered a code before submitting
    if (!code.trim()) {
      Alert.alert("Missing Code", "Please enter the verification code.");
      return;
    }

    try {
      // 2. Attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/(onboarding)/health-questionnaire");
      } else {
        // 3. status !== "complete": collect Clerk‐provided errors (if any)
        const messages: string[] = [];

        if (Array.isArray((signUpAttempt as any).errors)) {
          for (const e of (signUpAttempt as any).errors) {
            if (e.longMessage) {
              messages.push(e.longMessage);
            } else if (e.message) {
              messages.push(e.message);
            }
          }
        }

        if (messages.length === 0) {
          messages.push("Verification failed. Please check your code and try again.");
        }

        Alert.alert("Verification Error", messages.join("\n"));
        console.error("Clerk Verification Error:", JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err: any) {
      // 4. Catch unexpected exceptions and show all messages
      const messages: string[] = [];

      if (Array.isArray(err.errors)) {
        for (const e of err.errors) {
          if (e.longMessage) {
            messages.push(e.longMessage);
          } else if (e.message) {
            messages.push(e.message);
          }
        }
      }

      if (messages.length === 0 && err.message) {
        messages.push(err.message);
      }

      if (messages.length === 0) {
        messages.push("Invalid verification code. Please try again.");
      }

      Alert.alert("Error", messages.join("\n"));
      console.error("Clerk Verification Exception:", JSON.stringify(err, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Verify Email" showBackButton />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>
              Enter the code sent to your email
            </Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                value={code}
                placeholder="Enter verification code"
                placeholderTextColor={Colors.light.textSecondary}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
              />

              <TouchableOpacity style={styles.button} onPress={onVerifyPress}>
                <Text style={styles.buttonText}>Verify Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Sign Up" showBackButton={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter email"
              placeholderTextColor={Colors.light.textSecondary}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              value={password}
              placeholder="Enter password"
              placeholderTextColor={Colors.light.textSecondary}
              secureTextEntry={true}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={onSignUpPress}>
              <Text style={styles.buttonText}>Sign up</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
                <Text style={styles.link}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  button: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
  footerText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  link: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
