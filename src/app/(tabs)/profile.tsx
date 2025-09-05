import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/stores/authStore";
import useOnboardingStore from "@/stores/onboardingStore";
import { Alert, StyleSheet, View } from "react-native";
import { Avatar, Button, Card, Text } from "react-native-paper";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { resetOnboarding } = useOnboardingStore();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          resetOnboarding(); // Reset onboarding to show welcome screen again
        },
      },
    ]);
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will clear all authentication and onboarding data. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            logout();
            resetOnboarding();
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>No user data available</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Text
            size={80}
            label={(user?.name || user?.businessName || user?.email || "U")
              .charAt(0)
              .toUpperCase()}
            style={styles.avatar}
          />
          <Text variant="titleLarge" style={styles.title}>
            {user?.name || user?.businessName || "User"}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {user?.email}
          </Text>
          {user?.phone && (
            <Text variant="bodySmall" style={styles.phone}>
              {user.phone}
            </Text>
          )}
          {user?.businessName && (
            <Text variant="bodySmall" style={styles.business}>
              {user.businessName}
            </Text>
          )}
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.button}
          textColor="#FF6B6B"
        >
          Logout
        </Button>

        <Button
          mode="outlined"
          onPress={handleClearAllData}
          style={styles.button}
          textColor="#FFA500"
        >
          Clear All Data (Dev)
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    marginBottom: 30,
  },
  cardContent: {
    alignItems: "center",
  },
  avatar: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  phone: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 2,
  },
  business: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 2,
    fontWeight: "600",
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    marginVertical: 4,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "#FF6B6B",
  },
});
