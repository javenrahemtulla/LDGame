import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { PRESET_COLORS } from '../constants/fixtures';
import { FixtureColor } from '../types';

interface Props {
  currentColor: FixtureColor;
  onSelect: (color: FixtureColor) => void;
}

function colorToHex({ r, g, b }: FixtureColor) {
  return `rgb(${r},${g},${b})`;
}

export const ColorPicker: React.FC<Props> = ({ currentColor, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>COLOR</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PRESET_COLORS.map((preset) => {
          const isSelected =
            Math.abs(preset.color.r - currentColor.r) < 10 &&
            Math.abs(preset.color.g - currentColor.g) < 10 &&
            Math.abs(preset.color.b - currentColor.b) < 10;
          return (
            <TouchableOpacity
              key={preset.label}
              onPress={() => onSelect(preset.color)}
              style={[
                styles.swatch,
                { backgroundColor: colorToHex(preset.color) },
                isSelected && styles.selectedSwatch,
              ]}
            >
              {isSelected && <View style={styles.checkDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    color: '#666',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSwatch: {
    borderColor: '#ffffff',
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});
