/**
 * Klyntl Theme Provider
 *
 * Provides React Native Paper theme configuration throughout the app
 * with support for light/dark mode switching.
 */

import { StatusBar } from "expo-status-bar";
import React, { createContext, ReactNode, useContext } from "react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { Colors } from "../constants/Colors";
import { getTheme } from "../constants/Theme";

// Theme context for accessing theme values in components
interface ThemeContextType {
  isDark: boolean;
  colors: typeof Colors.light;
  toggleTheme?: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: Colors.light,
});

// Hook to use theme context
export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within a KlyntlThemeProvider");
  }
  return context;
};

interface KlyntlThemeProviderProps {
  children: ReactNode;
  forcedTheme?: "light" | "dark";
}

export const KlyntlThemeProvider: React.FC<KlyntlThemeProviderProps> = ({
  children,
  forcedTheme,
}) => {
  const systemColorScheme = useColorScheme();
  const isDark = forcedTheme
    ? forcedTheme === "dark"
    : systemColorScheme === "dark";

  const theme = getTheme(isDark);
  const colors = isDark ? Colors.dark : Colors.light;

  const themeContextValue: ThemeContextType = {
    isDark,
    colors,
  };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <PaperProvider theme={theme}>
        <StatusBar style={isDark ? "light" : "dark"} />
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};
