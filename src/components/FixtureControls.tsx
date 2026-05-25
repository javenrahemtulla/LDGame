import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { PlacedFixture } from '../types';
import { FIXTURE_DEFINITIONS } from '../constants/fixtures';
import { ColorPicker } from './ColorPicker';

interface Props {
  fixture: PlacedFixture;
  onUpdate: (id: string, changes: Partial<PlacedFixture>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const Row: React.FC<{ label: string; value: string; children: React.ReactNode }> = ({ label, value, children }) => (
  <View style={styles.row}>
    <View style={styles.rowHeader}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
    {children}
  </View>
);

export const FixtureControls: React.FC<Props> = ({ fixture, onUpdate, onDelete, onClose }) => {
  const def = FIXTURE_DEFINITIONS[fixture.type];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.fixtureName}>{def.icon} {def.name}</Text>
          <Text style={styles.fixtureId}>ID: {fixture.id}</Text>
        </View>
        <View style={styles.headerRight}>
          <Switch
            value={fixture.isOn}
            onValueChange={() => onUpdate(fixture.id, { isOn: !fixture.isOn })}
            trackColor={{ false: '#333', true: '#00e5ff50' }}
            thumbColor={fixture.isOn ? '#00e5ff' : '#555'}
          />
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(fixture.id)}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Color */}
      <ColorPicker
        currentColor={fixture.color}
        onSelect={(color) => onUpdate(fixture.id, { color })}
      />

      {/* Intensity */}
      <Row label="INTENSITY" value={`${Math.round(fixture.intensity * 100)}%`}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={fixture.intensity}
          onValueChange={(v) => onUpdate(fixture.id, { intensity: v })}
          minimumTrackTintColor="#00e5ff"
          maximumTrackTintColor="#333"
          thumbTintColor="#00e5ff"
        />
      </Row>

      {/* Pan (moving heads only) */}
      {def.canMove && (
        <Row label="PAN" value={`${Math.round(fixture.pan * 180)}°`}>
          <Slider
            style={styles.slider}
            minimumValue={-1}
            maximumValue={1}
            value={fixture.pan}
            onValueChange={(v) => onUpdate(fixture.id, { pan: v })}
            minimumTrackTintColor="#7c4dff"
            maximumTrackTintColor="#333"
            thumbTintColor="#7c4dff"
          />
        </Row>
      )}

      {/* Tilt (moving heads only) */}
      {def.canMove && (
        <Row label="TILT" value={`${Math.round(fixture.tilt * 90)}°`}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={fixture.tilt}
            onValueChange={(v) => onUpdate(fixture.id, { tilt: v })}
            minimumTrackTintColor="#7c4dff"
            maximumTrackTintColor="#333"
            thumbTintColor="#7c4dff"
          />
        </Row>
      )}

      {/* Beam angle */}
      <Row label="BEAM ANGLE" value={`${Math.round(fixture.beamAngle)}°`}>
        <Slider
          style={styles.slider}
          minimumValue={2}
          maximumValue={120}
          value={fixture.beamAngle}
          onValueChange={(v) => onUpdate(fixture.id, { beamAngle: v })}
          minimumTrackTintColor="#ff6400"
          maximumTrackTintColor="#333"
          thumbTintColor="#ff6400"
        />
      </Row>

      {/* Strobe rate */}
      {def.isStrobe && (
        <Row label="STROBE RATE" value={`${Math.round(fixture.strobeRate * 20)} Hz`}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={fixture.strobeRate}
            onValueChange={(v) => onUpdate(fixture.id, { strobeRate: v })}
            minimumTrackTintColor="#ffffff"
            maximumTrackTintColor="#333"
            thumbTintColor="#ffffff"
          />
        </Row>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fixtureName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  fixtureId: {
    color: '#555',
    fontSize: 11,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#ff4040',
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    marginBottom: 14,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rowLabel: {
    color: '#666',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  rowValue: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
  },
  slider: {
    height: 32,
    marginHorizontal: -8,
  },
});
