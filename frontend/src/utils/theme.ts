export type ThemeMode = "light" | "dark";

export type ThemeColors = {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  iconBg: string;
  accent: string;
  accentMuted: string;
};

const light: ThemeColors = {
  bg: "#F7F3F0",
  card: "#FFFFFF",
  text: "#1A1A1A",
  textMuted: "#888",
  border: "#E8DFD5",
  iconBg: "#F7F3F0",
  accent: "#D4A373",
  accentMuted: "rgba(212,163,115,0.2)",
};

const dark: ThemeColors = {
  bg: "#15110E",
  card: "#1F1A16",
  text: "#F5EFEA",
  textMuted: "#9A8F86",
  border: "#3A2F26",
  iconBg: "#2A211B",
  accent: "#D4A373",
  accentMuted: "rgba(212,163,115,0.18)",
};

export const themes: Record<ThemeMode, ThemeColors> = { light, dark };
