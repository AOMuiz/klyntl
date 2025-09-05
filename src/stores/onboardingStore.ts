import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const ONBOARDING_KEY = "hasSeenOnboarding";

interface OnboardingStore {
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (value: boolean) => void;
  resetOnboarding: () => Promise<void>;
}

const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (value: boolean) =>
        set({ hasSeenOnboarding: value }),
      resetOnboarding: async () => {
        await AsyncStorage.removeItem(ONBOARDING_KEY);
        set({ hasSeenOnboarding: false });
      },
    }),
    {
      name: ONBOARDING_KEY, // storage key
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useOnboardingStore;
