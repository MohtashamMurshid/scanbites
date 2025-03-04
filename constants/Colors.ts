/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#FF6C40";
const tintColorDark = "#FF8F6D";

export default {
  light: {
    primary: tintColorLight,
    secondary: "#FF8F6D",
    background: "#FFFFFF",
    surface: "#F8F9FA",
    text: "#1A1A1A",
    textSecondary: "#666666",
    border: "#EEEEEE",
    tint: tintColorLight,
    tabIconDefault: "#CCCCCC",
    tabIconSelected: tintColorLight,
    cardBackground: "#FFFFFF",
    error: "#FF3B30",
    success: "#34C759",
    warning: "#FFCC00",
  },
  dark: {
    primary: tintColorDark,
    secondary: "#FF6C40",
    background: "#1A1A1A",
    surface: "#2C2C2C",
    text: "#FFFFFF",
    textSecondary: "#AAAAAA",
    border: "#404040",
    tint: tintColorDark,
    tabIconDefault: "#666666",
    tabIconSelected: tintColorDark,
    cardBackground: "#2C2C2C",
    error: "#FF453A",
    success: "#32D74B",
    warning: "#FFD60A",
  },
};
