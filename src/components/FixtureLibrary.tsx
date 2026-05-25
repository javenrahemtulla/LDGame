import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { FixtureType } from '../types';
import { FIXTURE_DEFINITIONS } from '../constants/fixtures';

interface Props {
  visible: boolean;
  trussLabel: string;
  onSelect: (type: FixtureType) => void;
  onClose: () => void;
}

const FIXTURE_ORDER: FixtureType[] = ['par', 'moving-head-spot', 'moving-head-wash', 'led-bar', 'strobe', 'laser'];

export const FixtureLibrary: React.FC<Props> = ({ visible, trussLabel, onSelect, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Hang a Fixture</Text>
          <Text style={styles.subtitle}>{trussLabel}</Text>
          <ScrollView contentContainerStyle={styles.list}>
            {FIXTURE_ORDER.map((type) => {
              const def = FIXTURE_DEFINITIONS[type];
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.item, { borderLeftColor: def.accentColor }]}
                  onPress={() => onSelect(type)}
                >
                  <Text style={styles.itemIcon}>{def.icon}</Text>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{def.name}</Text>
                    <Text style={styles.itemDesc}>{def.description}</Text>
                    <View style={styles.badges}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{def.beamAngle}° beam</Text>
                      </View>
                      {def.canMove && (
                        <View style={[styles.badge, styles.badgeBlue]}>
                          <Text style={styles.badgeText}>Moving</Text>
                        </View>
                      )}
                      {def.isStrobe && (
                        <View style={[styles.badge, styles.badgeYellow]}>
                          <Text style={styles.badgeText}>Strobe</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 8,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: '#666',
    fontSize: 13,
    marginBottom: 16,
  },
  list: {
    gap: 10,
  },
  item: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  itemIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemDesc: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeBlue: {
    backgroundColor: '#0a2040',
  },
  badgeYellow: {
    backgroundColor: '#2a2000',
  },
  badgeText: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: '600',
  },
  arrow: {
    color: '#444',
    fontSize: 22,
    marginLeft: 8,
  },
  cancelBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
});
