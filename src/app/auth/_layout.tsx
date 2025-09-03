import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Stack } from "expo-router";

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.text,
        },
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerShown: false, // Let the login layout handle its own header
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerShown: false, // Let the register layout handle its own header
        }}
      />
    </Stack>
  );
}
