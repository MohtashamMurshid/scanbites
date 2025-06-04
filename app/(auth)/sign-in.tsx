import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
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
import React from "react";
import Colors from "@/constants/Colors";
import { CustomHeader } from "@/components/CustomHeader";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");

  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) return;

    // Basic front-end check: ensure fields are not empty
    if (!emailAddress.trim() || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        // If Clerk did not immediately complete the flow, try to extract any messages
        const messages: string[] = [];

        // Sometimes Clerk returns an `errors` array inside `signInAttempt`
        if (Array.isArray((signInAttempt as any).errors)) {
          for (const e of (signInAttempt as any).errors) {
            if (e.longMessage) {
              messages.push(e.longMessage);
            } else if (e.message) {
              messages.push(e.message);
            }
          }
        }

        // Fallback to a generic message if none were provided
        if (messages.length === 0) {
          messages.push("Invalid email or password.");
        }

        Alert.alert("Sign-In Error", messages.join("\n"));
        console.error("SignInAttempt:", JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      // Clerk usually throws a ClerkAPIResponseError, which contains an `errors` array
      const messages: string[] = [];

      if (Array.isArray(err.errors)) {
        for (const e of err.errors) {
          if (e.longMessage) {
            messages.push(e.longMessage);
          } else if (e.message) {
            messages.push(e.message);
          }
        }
      } else if (err.message) {
        // Fallback to err.message if no structured `errors` array exists
        messages.push(err.message);
      }

      if (messages.length === 0) {
        messages.push("An unexpected error occurred.");
      }

      Alert.alert("Error", messages.join("\n"));
      console.error("ClerkError:", JSON.stringify(err, null, 2));
    }
  }, [isLoaded, emailAddress, password, router, setActive, signIn]);

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Sign In" showBackButton={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailAddress}
              placeholder="Enter email"
              placeholderTextColor={Colors.light.textSecondary}
              onChangeText={setEmailAddress}
            />
            <TextInput
              style={styles.input}
              value={password}
              placeholder="Enter password"
              placeholderTextColor={Colors.light.textSecondary}
              secureTextEntry={true}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={onSignInPress}>
              <Text style={styles.buttonText}>Sign in</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Sign up</Text>
                </TouchableOpacity>
              </Link>
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
