import { ModalCloseButton } from "@/components/ui/ModalCloseButton";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Stack } from "expo-router";

export default function ModalCustomerLayout() {
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
        headerLeft: () => <ModalCloseButton variant="icon" />,
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          title: "Add Customer",
          presentation: "modal",
          headerLeft: () => <ModalCloseButton variant="cancel" text="Cancel" />,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: "Edit Customer",
          presentation: "modal",
          headerLeft: () => <ModalCloseButton variant="text" text="Close" />,
        }}
      />
    </Stack>
  );
}
