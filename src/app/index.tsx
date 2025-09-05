import { useAuth } from "@/stores/authStore";
import useOnboardingStore from "@/stores/onboardingStore";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function IndexScreen() {
  const { hasSeenOnboarding } = useOnboardingStore();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Determine where to redirect based on user state
    const redirect = () => {
      if (!hasSeenOnboarding) {
        router.replace("/onboarding");
      } else if (!isAuthenticated) {
        router.replace("/auth/login");
      } else {
        router.replace("/(tabs)");
      }
    };

    // Small delay to prevent flash
    const timer = setTimeout(redirect, 100);
    return () => clearTimeout(timer);
  }, [hasSeenOnboarding, isAuthenticated, router]);

  // Show loading spinner while redirecting
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
