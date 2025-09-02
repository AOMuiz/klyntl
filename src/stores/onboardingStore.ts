import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const ONBOARDING_KEY = "hasSeenOnboarding";

interface OnboardingStore {
  hasSeenOnboarding: boolean;
  isLoading: boolean;
  setHasSeenOnboarding: (value: boolean) => void;
  initialize: () => Promise<void>;
}

const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  hasSeenOnboarding: false,
  isLoading: true,
  setHasSeenOnboarding: (value: boolean) => {
    AsyncStorage.setItem(ONBOARDING_KEY, value ? "true" : "false");
    set({ hasSeenOnboarding: value });
  },
  initialize: async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      set({ hasSeenOnboarding: value === "true", isLoading: false });
    } catch (error) {
      console.error("Error loading onboarding state:", error);
      set({ hasSeenOnboarding: false, isLoading: false });
    }
  },
}));

export default useOnboardingStore;
