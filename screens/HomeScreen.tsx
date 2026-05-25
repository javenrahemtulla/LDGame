import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { VenueId } from '../src/types';
import { VENUE_CONFIGS, VENUE_LIST } from '../src/constants/venues';

interface Props {
  onSelectVenue: (id: VenueId) => void;
}

export const HomeScreen: React.FC<Props> = ({ onSelectVenue }) => {
  return (
    <View style={styles.bg}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>STAGE</Text>
            <Text style={styles.appTitleAccent}>LIGHT</Text>
            <Text style={styles.appSubtitle}>Design • Control • Perform</Text>
          </View>

          {/* Intro */}
          <Text style={styles.sectionLabel}>CHOOSE YOUR VENUE</Text>

          {/* Venue cards */}
          <View style={styles.venueGrid}>
            {VENUE_LIST.map((id) => {
              const venue = VENUE_CONFIGS[id];
              return (
                <TouchableOpacity
                  key={id}
                  style={styles.venueCard}
                  onPress={() => onSelectVenue(id)}
                  activeOpacity={0.75}
                >
                  {/* Fake stage preview */}
                  <View style={styles.venuePreview}>
                    <View style={styles.previewCeiling} />
                    {venue.trusses.map((t, i) => (
                      <View
                        key={i}
                        style={[
                          styles.previewTruss,
                          {
                            top: `${t.yPercent * 100}%`,
                            left: `${t.xStartPercent * 100}%`,
                            right: `${(1 - t.xEndPercent) * 100}%`,
                          },
                        ]}
                      />
                    ))}
                    <View style={[styles.previewFloor, { top: `${venue.floorYPercent * 100}%` }]} />
                    <Text style={styles.previewEmoji}>{venue.emoji}</Text>
                  </View>
                  {/* Info */}
                  <View style={styles.venueInfo}>
                    <Text style={styles.venueName}>{venue.name}</Text>
                    <Text style={styles.venueDesc}>{venue.description}</Text>
                    <View style={styles.venueStats}>
                      <Text style={styles.venueStat}>{venue.trusses.length} trusses</Text>
                      <Text style={styles.venueDot}>·</Text>
                      <Text style={styles.venueStat}>Up to {venue.maxFixtures} fixtures</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tips */}
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>HOW TO PLAY</Text>
            <Text style={styles.tip}>💡  Tap a truss to hang a fixture</Text>
            <Text style={styles.tip}>🎛  Tap a fixture to control it</Text>
            <Text style={styles.tip}>🎵  Load a song to sync lights to the beat</Text>
            <Text style={styles.tip}>🎮  Use the toolbar to go full blackout or all-on</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#050508',
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  appTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 8,
    lineHeight: 56,
  },
  appTitleAccent: {
    fontSize: 52,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 8,
    lineHeight: 56,
    textShadowColor: '#00e5ff60',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  appSubtitle: {
    color: '#555',
    fontSize: 13,
    letterSpacing: 4,
    marginTop: 8,
  },
  sectionLabel: {
    color: '#444',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 14,
  },
  venueGrid: {
    gap: 12,
    marginBottom: 32,
  },
  venueCard: {
    backgroundColor: '#0d0d12',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1a1a2a',
    flexDirection: 'row',
  },
  venuePreview: {
    width: 110,
    height: 90,
    backgroundColor: '#080810',
    position: 'relative',
    overflow: 'hidden',
  },
  previewCeiling: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#111',
  },
  previewTruss: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#333',
  },
  previewFloor: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#222',
  },
  previewEmoji: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    fontSize: 28,
    opacity: 0.6,
  },
  venueInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  venueName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  venueDesc: {
    color: '#666',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  venueStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  venueStat: {
    color: '#00e5ff80',
    fontSize: 11,
    fontWeight: '600',
  },
  venueDot: {
    color: '#333',
    fontSize: 11,
  },
  tips: {
    backgroundColor: '#0a0a10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a1a25',
    gap: 10,
  },
  tipsTitle: {
    color: '#444',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 4,
  },
  tip: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
});
