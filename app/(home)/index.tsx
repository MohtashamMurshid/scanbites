import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Page() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <View>
      <SignedIn>
        <Text>Hello {user?.emailAddresses[0].emailAddress}</Text>
        <Link href="/(onboarding)/business-registration">
          <Text>Register a business</Text>
        </Link>
        <TouchableOpacity onPress={() => signOut()}>
          <Text>Sign out</Text>
        </TouchableOpacity>
      </SignedIn>
      <SignedOut>
        <Link href="/(auth)/sign-in">
          <Text>Sign in</Text>
        </Link>
        <Link href="/(auth)/sign-up">
          <Text>Sign up</Text>
        </Link>
      </SignedOut>
    </View>
  );
}
