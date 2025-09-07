import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: true, title: "Settings" }}
      />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen
        name="privacy"
        options={{
          headerBackVisible: true,
          //   headerShown: false, // Let the store layout handle its own header
          title: "Privacy Policy",
        }}
      />
      <Stack.Screen
        name="account"
        options={{
          headerBackVisible: true,
          //   headerShown: false, // Let the store layout handle its own header
          title: "Account Settings",
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          headerBackVisible: true,
          //   headerShown: false, // Let the customer layout handle its own header
          title: "Terms of Service",
        }}
      />
    </Stack>
  );
}
