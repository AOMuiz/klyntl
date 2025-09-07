import ScreenContainer, {
  edgesHorizontal,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";

export default function SettingsAccount() {
  return (
    <ScreenContainer scrollable={false} edges={edgesHorizontal}>
      <ThemedText type="h2">Account</ThemedText>
      <ThemedText style={{ marginTop: 12 }}>
        Manage your account settings.
      </ThemedText>
    </ScreenContainer>
  );
}
