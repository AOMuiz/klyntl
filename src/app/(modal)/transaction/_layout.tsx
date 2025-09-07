import { ModalCloseButton } from "@/components/ui/ModalCloseButton";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Stack } from "expo-router";

export default function ModalTransactionLayout() {
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
        headerLeft: () => <ModalCloseButton variant="icon" iconName="xmark" />,
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          title: "Add Transaction",
          presentation: "modal",
          headerLeft: () => (
            <ModalCloseButton
              variant="cancel"
              text="Cancel"
              textColor={colors.error}
            />
          ),
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: "Edit Transaction",
          presentation: "modal",
          headerLeft: () => (
            <ModalCloseButton
              variant="text"
              text="Done"
              textColor={colors.primary}
            />
          ),
        }}
      />
      <Stack.Screen
        name="summary"
        options={{
          title: "Transaction Summary",
          presentation: "modal",
          headerLeft: () => (
            <ModalCloseButton
              variant="text"
              text="Done"
              textColor={colors.primary}
            />
          ),
        }}
      />
    </Stack>
  );
}
