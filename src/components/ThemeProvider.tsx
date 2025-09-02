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
import {
  ExtendedKlyntlTheme,
  getKlyntlTheme,
  useKlyntlColors,
} from "../constants/KlyntlTheme";

// Theme context for accessing theme values in components
interface ThemeContextType {
  isDark: boolean;
  theme: ExtendedKlyntlTheme;
  colors: ReturnType<typeof useKlyntlColors>;
  toggleTheme?: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

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

  const theme = getKlyntlTheme(systemColorScheme);
  const colors = useKlyntlColors(theme);

  const themeContextValue: ThemeContextType = {
    isDark,
    theme,
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
