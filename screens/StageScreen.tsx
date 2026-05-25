import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ScrollView,
  StatusBar,
  LayoutChangeEvent,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StageCanvas } from '../src/components/StageCanvas';
import { FixtureLibrary } from '../src/components/FixtureLibrary';
import { FixtureControls } from '../src/components/FixtureControls';
import { MusicPanel } from '../src/components/MusicPanel';
import { useStageStore } from '../src/store/useStageStore';
import { useMusicStore } from '../src/store/useMusicStore';
import { VENUE_CONFIGS } from '../src/constants/venues';
import { FixtureType, PlacedFixture } from '../src/types';

type BottomPanel = 'controls' | 'music' | null;

interface Props {
  onBack: () => void;
}

const BOTTOM_PANEL_HEIGHT = 300;

export const StageScreen: React.FC<Props> = ({ onBack }) => {
  const {
    venueId,
    fixtures,
    selectedFixtureId,
    isHazeOn,
    selectFixture,
    addFixture,
    removeFixture,
    updateFixture,
    allLightsOn,
    allLightsOff,
    blackout,
    toggleHaze,
  } = useStageStore();

  const { isPlaying, trackName } = useMusicStore();

  const venue = VENUE_CONFIGS[venueId];

  const [bottomPanel, setBottomPanel] = useState<BottomPanel>(null);
  const [pendingTruss, setPendingTruss] = useState<{ index: number; position: number; label: string } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const selectedFixture = fixtures.find((f) => f.id === selectedFixtureId) ?? null;

  // Strobe animation
  const strobeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [strobeState, setStrobeState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const strobeFixtures = fixtures.filter((f) => f.type === 'strobe' && f.isOn);
    if (strobeFixtures.length === 0) {
      if (strobeRef.current) clearInterval(strobeRef.current);
      return;
    }
    if (strobeRef.current) clearInterval(strobeRef.current);
    strobeRef.current = setInterval(() => {
      setStrobeState((prev) => {
        const next: Record<string, boolean> = {};
        for (const f of strobeFixtures) {
          next[f.id] = !prev[f.id];
        }
        return next;
      });
    }, 50);
    return () => {
      if (strobeRef.current) clearInterval(strobeRef.current);
    };
  }, [fixtures.filter((f) => f.type === 'strobe' && f.isOn).length]);

  const renderFixtures = fixtures.map((f) => {
    if (f.type === 'strobe') {
      return { ...f, intensity: strobeState[f.id] ? f.intensity : 0 };
    }
    return f;
  });

  const handleCanvasLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  };

  const handleTapTruss = (trussIndex: number, position: number) => {
    const truss = venue.trusses[trussIndex];
    if (!truss) return;
    setPendingTruss({ index: trussIndex, position, label: truss.label });
    selectFixture(null);
    setBottomPanel(null);
  };

  const handleAddFixture = (type: FixtureType) => {
    if (!pendingTruss) return;
    addFixture(type, pendingTruss.index, pendingTruss.position);
    setPendingTruss(null);
  };

  const handleTapFixture = (id: string) => {
    selectFixture(id);
    setBottomPanel('controls');
  };

  const handleTapEmpty = () => {
    selectFixture(null);
    if (bottomPanel === 'controls') setBottomPanel(null);
  };

  const handleDeleteFixture = (id: string) => {
    removeFixture(id);
    setBottomPanel(null);
  };

  const togglePanel = (panel: BottomPanel) => {
    if (panel === 'controls' && !selectedFixtureId) return;
    setBottomPanel((prev) => (prev === panel ? null : panel));
  };

  const panelHeight = bottomPanel ? BOTTOM_PANEL_HEIGHT : 0;
  const stageAreaHeight = canvasSize.height > 0 ? canvasSize.height : 0;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.bg}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <View style={styles.venueInfo}>
              <Text style={styles.venueEmoji}>{venue.emoji}</Text>
              <Text style={styles.venueName}>{venue.name}</Text>
            </View>
            <View style={styles.topRight}>
              <Text style={styles.fixtureCount}>{fixtures.length} fixtures</Text>
            </View>
          </View>

          {/* Toolbar */}
          <View style={styles.toolbar}>
            <ToolBtn label="ALL ON" icon="☀" onPress={allLightsOn} />
            <ToolBtn label="ALL OFF" icon="🌑" onPress={allLightsOff} />
            <ToolBtn label="BLACKOUT" icon="✕" onPress={blackout} accent="#ff2020" />
            <ToolBtn label={isHazeOn ? 'HAZE ON' : 'HAZE'} icon="💨" onPress={toggleHaze} active={isHazeOn} />
          </View>

          {/* Stage canvas */}
          <View style={styles.stageArea} onLayout={handleCanvasLayout}>
            {canvasSize.width > 0 && (
              <StageCanvas
                width={canvasSize.width}
                height={canvasSize.height}
                venue={venue}
                fixtures={renderFixtures}
                selectedId={selectedFixtureId}
                isHazeOn={isHazeOn}
                onTapTruss={handleTapTruss}
                onTapFixture={handleTapFixture}
                onTapEmpty={handleTapEmpty}
              />
            )}

            {/* Hint overlay */}
            {fixtures.length === 0 && canvasSize.width > 0 && (
              <View style={styles.hintOverlay} pointerEvents="none">
                <Text style={styles.hintText}>Tap a truss to hang a fixture</Text>
                <Text style={styles.hintArrow}>↑</Text>
              </View>
            )}
          </View>

          {/* Bottom tab bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, bottomPanel === 'controls' && styles.tabActive]}
              onPress={() => togglePanel('controls')}
              disabled={!selectedFixtureId}
            >
              <Text style={styles.tabIcon}>🎛</Text>
              <Text style={[styles.tabLabel, !selectedFixtureId && styles.tabDisabled]}>
                {selectedFixture ? FIXTURE_LABELS[selectedFixture.type] ?? 'Fixture' : 'Select a fixture'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, bottomPanel === 'music' && styles.tabActive]}
              onPress={() => togglePanel('music')}
            >
              <Text style={styles.tabIcon}>{isPlaying ? '▶' : '🎵'}</Text>
              <Text style={styles.tabLabel}>{trackName ? 'Music' : 'Load Music'}</Text>
              {isPlaying && <View style={styles.playingDot} />}
            </TouchableOpacity>
          </View>

          {/* Bottom panel */}
          {bottomPanel && (
            <View style={[styles.bottomPanel, { height: BOTTOM_PANEL_HEIGHT }]}>
              <View style={styles.panelHandle} />
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                {bottomPanel === 'controls' && selectedFixture && (
                  <FixtureControls
                    fixture={selectedFixture}
                    onUpdate={(id, changes) => updateFixture(id, changes)}
                    onDelete={handleDeleteFixture}
                    onClose={() => setBottomPanel(null)}
                  />
                )}
                {bottomPanel === 'music' && <MusicPanel />}
              </ScrollView>
            </View>
          )}
        </SafeAreaView>

        {/* Fixture library modal */}
        <FixtureLibrary
          visible={!!pendingTruss}
          trussLabel={pendingTruss?.label ?? ''}
          onSelect={handleAddFixture}
          onClose={() => setPendingTruss(null)}
        />
      </View>
    </GestureHandlerRootView>
  );
};

const FIXTURE_LABELS: Record<string, string> = {
  par: 'PAR Can',
  'moving-head-spot': 'Moving Spot',
  'moving-head-wash': 'Moving Wash',
  'led-bar': 'LED Bar',
  strobe: 'Strobe',
  laser: 'Laser',
};

const ToolBtn: React.FC<{
  label: string;
  icon: string;
  onPress: () => void;
  accent?: string;
  active?: boolean;
}> = ({ label, icon, onPress, accent, active }) => (
  <TouchableOpacity
    style={[styles.toolBtn, active && styles.toolBtnActive, accent ? { borderColor: accent + '60' } : {}]}
    onPress={onPress}
  >
    <Text style={styles.toolBtnIcon}>{icon}</Text>
    <Text style={[styles.toolBtnLabel, accent ? { color: accent } : {}, active ? { color: '#00e5ff' } : {}]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#050508',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#080810',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#00e5ff',
    fontSize: 28,
    fontWeight: '300',
  },
  venueInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  venueEmoji: {
    fontSize: 18,
  },
  venueName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  topRight: {
    alignItems: 'flex-end',
  },
  fixtureCount: {
    color: '#555',
    fontSize: 12,
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#080812',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  toolBtn: {
    flex: 1,
    backgroundColor: '#111118',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222230',
  },
  toolBtnActive: {
    backgroundColor: '#00152a',
    borderColor: '#00e5ff40',
  },
  toolBtnIcon: {
    fontSize: 14,
  },
  toolBtnLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  stageArea: {
    flex: 1,
  },
  hintOverlay: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: '#444',
    fontSize: 14,
    letterSpacing: 1,
  },
  hintArrow: {
    color: '#333',
    fontSize: 20,
    marginTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0a0a12',
    borderTopWidth: 1,
    borderTopColor: '#1a1a28',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  tabActive: {
    borderTopColor: '#00e5ff',
    backgroundColor: '#00101a',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  tabDisabled: {
    opacity: 0.4,
  },
  playingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00e5ff',
  },
  bottomPanel: {
    backgroundColor: '#0d0d18',
    borderTopWidth: 1,
    borderTopColor: '#1a1a2a',
  },
  panelHandle: {
    width: 36,
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
});
