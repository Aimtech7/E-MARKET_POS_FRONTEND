/**
 * Palette is type to describe the main colors of the site
 */
type Palette = {
  primary: string;
  secondary: string;
  error: string;
  warning: string;
  paper: string;
  textAction: string;
  textPrimary: string;
  textSecondary: string;
  background: string;
  shadow:string;
  success:string;
};

const saasDarkTheme: Palette = {
  primary: "#2563EB",
  secondary: "#3B82F6", // slightly lighter blue
  error: "#EF4444",
  paper: "#1E293B", // Surface
  warning: "#F59E0B",
  textPrimary: "#F8FAFC", // Text
  textSecondary: "#94A3B8", // Secondary Text
  textAction: "#ffffff",
  background: "#0F172A", // Background
  shadow: "rgba(0, 0, 0, 0.25)",
  success: "#10B981"
};

const primaryTheme: Palette = saasDarkTheme;
const darkTheme: Palette = saasDarkTheme;
const greenTheme: Palette = saasDarkTheme;
const matrialTheme: Palette = saasDarkTheme;

export type keys = "primary" | "green" | "dark" | "matrial";

export const palettes: Record<keys, Palette> = {
  primary: primaryTheme,
  green: greenTheme,
  dark: darkTheme,
  matrial:matrialTheme
};

export default Palette;
