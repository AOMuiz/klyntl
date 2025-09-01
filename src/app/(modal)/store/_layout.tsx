import { ModalCloseButton } from "@/components/ui/ModalCloseButton";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Stack } from "expo-router";

export default function ModalStoreLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.text,
        },
        headerTitleAlign: "center",
        headerLeft: () => <ModalCloseButton />,
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          title: "Add Store Item",
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: "Edit Store Item",
        }}
      />
    </Stack>
  );
}
