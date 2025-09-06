import { ThemedText } from "@/components/ThemedText";
import { hp, wp } from "@/utils/responsive_dimensions_system";
import { View, ViewStyle } from "react-native";
import { HelperText, useTheme } from "react-native-paper";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  children,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[{ marginBottom: hp(10) }, style]}>
      <ThemedText
        style={{
          fontSize: wp(16),
          fontWeight: "600",
          marginBottom: 8,
          color: theme.colors.onSurface,
        }}
      >
        {label} {required && "*"}
      </ThemedText>

      {children}

      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
    </View>
  );
};
