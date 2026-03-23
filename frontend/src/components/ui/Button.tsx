// components/ui/Button.tsx
import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { scale, moderateScale } from "../../utils/responsive";

type ButtonProps = {
  title?: string;                // optional text
  children?: React.ReactNode;    // optional icon or JSX
  onPress: () => void;
  variant?: "caramel" | "outline";
  size?: "sm" | "md" | "icon";
  disabled?: boolean;
  style?: ViewStyle;             // allow custom styles
  textStyle?: TextStyle;         // allow custom text styles
};

export default function Button({
  title,
  children,
  onPress,
  variant = "caramel",
  size = "md",
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  // size styles
  const padding = size === "sm" ? scale(8) : size === "icon" ? scale(6) : scale(12);
  const fontSize = size === "sm" ? moderateScale(14) : moderateScale(16);

  return (
    <Pressable
      style={[
        styles.button,
        variant === "caramel" ? styles.caramel : styles.outline,
        size === "icon" && styles.iconButton,
        { paddingHorizontal: padding, paddingVertical: padding },
        disabled && styles.disabled,
        style,
      ]}
      onPress={disabled ? undefined : onPress}
    >
      {children ? (
        children
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize },
            variant === "outline" && styles.outlineText,
            disabled && { color: variant === "caramel" ? "#FFF" : "#D4A373" },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(8),
  },
  caramel: {
    backgroundColor: "#D4A373",
  },
  outline: {
    borderWidth: 1,
    borderColor: "#D4A373",
  },
  iconButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  text: {
    color: "#FFF",
    fontWeight: "bold",
  },
  outlineText: {
    color: "#D4A373",
  },
  disabled: {
    opacity: 0.5,
  },
});