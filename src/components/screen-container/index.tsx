import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { isIOS } from "@/utils/helpers";
import { Edge, SafeAreaView } from "react-native-safe-area-context";

import { hp, wp } from "@/utils/responsive_dimensions_system";

export const edgesHorizontal = ["left", "right"] as Edge[];
export const edgesVertical = ["top", "bottom"] as Edge[];

export interface ScreenContainerProps {
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  // Add control for padding
  withPadding?: boolean;
  paddingHorizontal?: number;
  paddingVertical?: number;
  // Add control for edges
  edges?: Edge[];
  // Add control for status bar
  statusBarStyle?: "light-content" | "dark-content";
  hideStatusBar?: boolean;
  // Add control for background color
  backgroundColor?: string;
  // Add loading state
  isLoading?: boolean;
  // Add scroll capability flag
  scrollable?: boolean;
  // Add keyboard handling
  keyboardShouldAvoidView?: boolean;
  scrollViewProps?: ScrollViewProps;
  // Add themed functionality control
  useThemedView?: boolean;
  // Add theme override
  forceTheme?: "light" | "dark";
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  containerStyle,
  contentStyle,
  withPadding = true,
  paddingHorizontal = 20,
  paddingVertical = 0,
  edges = ["left", "right", "top"],
  scrollable = false,
  keyboardShouldAvoidView = false,
  scrollViewProps,
  useThemedView = true, // Default to true for themed behavior
  forceTheme,
  backgroundColor,
}) => {
  const colorScheme = useColorScheme();
  const currentTheme = forceTheme || colorScheme || "light";

  // Calculate padding based on props and insets
  const padding = {
    paddingHorizontal: withPadding ? wp(paddingHorizontal) : 0,
    paddingVertical: withPadding ? hp(paddingVertical) : 0,
  };

  // Get themed background color
  const getThemedBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    if (!useThemedView) return "white"; // Default fallback
    return Colors[currentTheme].background;
  };

  // Determine the content component based on scrollable prop
  const ContentWrapper = scrollable ? ScrollView : View;

  // Keyboard avoiding view for iOS
  const KeyboardWrapper =
    keyboardShouldAvoidView && Platform.OS === "ios"
      ? KeyboardAvoidingView
      : View;

  // Choose between ThemedView and regular View for the main container
  const MainContainer = useThemedView ? ThemedView : View;

  return (
    <SafeAreaView
      style={[
        styles.screen,
        { backgroundColor: getThemedBackgroundColor() },
        containerStyle,
      ]}
      edges={edges}
    >
      <KeyboardWrapper
        style={styles.keyboardWrapper}
        behavior={isIOS() ? "padding" : undefined}
      >
        <MainContainer style={styles.themedContainer}>
          <ContentWrapper
            style={[styles.content, padding, contentStyle]}
            showsVerticalScrollIndicator={false}
            {...(scrollable && scrollViewProps)}
          >
            {children}
          </ContentWrapper>
        </MainContainer>
      </KeyboardWrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  themedContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  keyboardWrapper: {
    flex: 1,
  },
});

export default ScreenContainer;
