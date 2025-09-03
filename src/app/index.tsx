import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem("onboardingSeen");
        router.replace(seen === "true" ? "/(tabs)" : "/onboarding");
      } catch (e) {
        router.replace("/onboarding");
      }
    })();
  }, []);

  return null;
}
