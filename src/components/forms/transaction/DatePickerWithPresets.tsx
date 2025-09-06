import { ThemedText } from "@/components/ThemedText";
import { format } from "date-fns";
import { TouchableOpacity, View } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";

interface DatePickerWithPresetsProps {
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const DatePickerWithPresets: React.FC<DatePickerWithPresetsProps> = ({
  value,
  onChange,
  error,
  isVisible,
  onToggleVisibility,
}) => {
  const theme = useTheme();

  const datePresets = [
    {
      label: "Today",
      getValue: () => new Date(),
      containerColor: theme.colors.primaryContainer,
      textColor: theme.colors.onPrimaryContainer,
    },
    {
      label: "Yesterday",
      getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
      },
      containerColor: theme.colors.secondaryContainer,
      textColor: theme.colors.onSecondaryContainer,
    },
    {
      label: "Last Week",
      getValue: () => {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        return lastWeek;
      },
      containerColor: theme.colors.tertiaryContainer,
      textColor: theme.colors.onTertiaryContainer,
    },
  ];

  return (
    <View>
      {/* Label removed: FormField provides the field label to avoid duplicates */}

      <TouchableOpacity
        onPress={onToggleVisibility}
        style={{ marginBottom: 8 }}
        activeOpacity={0.7}
      >
        <View pointerEvents="none">
          <TextInput
            // label removed; FormField shows label
            mode="outlined"
            value={format(value, "PPP")}
            editable={false}
            style={{ backgroundColor: theme.colors.elevation.level1 }}
            left={<TextInput.Icon icon="calendar" />}
          />
        </View>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", marginTop: 8, gap: 8 }}>
        {datePresets.map((preset, index) => (
          <TouchableOpacity
            key={index}
            style={[
              {
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 6,
              },
              { backgroundColor: preset.containerColor },
            ]}
            onPress={() => onChange(preset.getValue())}
          >
            <ThemedText
              style={[
                { fontSize: 12, fontWeight: "600" },
                { color: preset.textColor },
              ]}
            >
              {preset.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <DatePickerModal
        visible={isVisible}
        mode="single"
        onDismiss={onToggleVisibility}
        date={value}
        onConfirm={({ date }) => {
          if (date) {
            onChange(date);
          }
          onToggleVisibility();
        }}
        presentationStyle="pageSheet"
        locale="en"
      />

      {error && (
        <ThemedText
          style={{ fontSize: 12, color: theme.colors.error, marginTop: 4 }}
        >
          {error}
        </ThemedText>
      )}
    </View>
  );
};
