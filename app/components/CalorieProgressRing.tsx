import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Colors from "@/constants/Colors";

interface CalorieProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  calories: number;
  target: number;
}

export default function CalorieProgressRing({
  progress,
  size = 120,
  strokeWidth = 12,
  calories,
  target,
}: CalorieProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (progress / 100) * circumference;

  const getProgressColor = (progress: number) => {
    if (progress <= 75) return Colors.light.primary;
    if (progress <= 100) return "#FFA500";
    return "#FF6B6B";
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.light.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getProgressColor(progress)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.content, { width: size, height: size }]}>
        <Text style={styles.calorieText}>{calories}</Text>
        <Text style={styles.targetText}>/ {target}</Text>
        <Text style={styles.label}>cal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  calorieText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  targetText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  label: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
