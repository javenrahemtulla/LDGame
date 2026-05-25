import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useMusicStore } from '../store/useMusicStore';
import { useStageStore } from '../store/useStageStore';
import { useBeatDetection } from '../hooks/useBeatDetection';
import { SyncMode } from '../types';

function formatTime(ms: number) {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SYNC_MODES: { id: SyncMode; label: string; icon: string }[] = [
  { id: 'off', label: 'Off', icon: '—' },
  { id: 'beat-flash', label: 'Flash', icon: '⚡' },
  { id: 'color-cycle', label: 'Colors', icon: '🌈' },
  { id: 'chase', label: 'Chase', icon: '➤' },
  { id: 'pulse', label: 'Pulse', icon: '〰' },
];

export const MusicPanel: React.FC = () => {
  const { trackName, isPlaying, isLoading, positionMs, durationMs, loadTrack, play, pause, stop, error } = useMusicStore();
  const { syncMode, setSyncMode, triggerBeat } = useStageStore();

  const { processMeter } = useBeatDetection(
    useCallback((intensity: number) => {
      triggerBeat(intensity);
    }, [triggerBeat])
  );

  const handleStatusUpdate = useCallback(
    (metering: number, playing: boolean) => {
      processMeter(metering, playing);
    },
    [processMeter]
  );

  const pickTrack = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await loadTrack(asset.uri, asset.name, handleStatusUpdate);
      }
    } catch (e) {
      console.warn('DocumentPicker error', e);
    }
  };

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <View style={styles.container}>
      {/* Track info */}
      <View style={styles.trackRow}>
        {trackName ? (
          <View style={styles.trackInfo}>
            <Text style={styles.trackName} numberOfLines={1}>{trackName}</Text>
            <Text style={styles.trackTime}>{formatTime(positionMs)} / {formatTime(durationMs)}</Text>
          </View>
        ) : (
          <Text style={styles.noTrack}>No track loaded</Text>
        )}
        <TouchableOpacity style={styles.pickBtn} onPress={pickTrack}>
          <Text style={styles.pickText}>📂</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {durationMs > 0 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}

      {/* Transport controls */}
      <View style={styles.transport}>
        <TouchableOpacity style={styles.transportBtn} onPress={stop} disabled={!trackName}>
          <Text style={[styles.transportIcon, !trackName && styles.disabled]}>⏹</Text>
        </TouchableOpacity>
        {isLoading ? (
          <ActivityIndicator color="#00e5ff" size="large" />
        ) : (
          <TouchableOpacity
            style={[styles.playBtn, !trackName && styles.playBtnDisabled]}
            onPress={isPlaying ? pause : play}
            disabled={!trackName}
          >
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
        )}
        <View style={{ width: 44 }} />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Sync modes */}
      <View style={styles.syncSection}>
        <Text style={styles.syncLabel}>BEAT SYNC</Text>
        <View style={styles.syncModes}>
          {SYNC_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[styles.syncChip, syncMode === mode.id && styles.syncChipActive]}
              onPress={() => setSyncMode(mode.id)}
            >
              <Text style={styles.syncChipIcon}>{mode.icon}</Text>
              <Text style={[styles.syncChipLabel, syncMode === mode.id && styles.syncChipLabelActive]}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  trackTime: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  noTrack: {
    flex: 1,
    color: '#555',
    fontSize: 14,
  },
  pickBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickText: {
    fontSize: 20,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#222',
    borderRadius: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#00e5ff',
    borderRadius: 2,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  transportBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportIcon: {
    fontSize: 18,
    color: '#aaa',
  },
  disabled: {
    opacity: 0.3,
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnDisabled: {
    backgroundColor: '#1a3040',
  },
  playIcon: {
    fontSize: 24,
    color: '#000',
  },
  errorText: {
    color: '#ff4040',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  syncSection: {},
  syncLabel: {
    color: '#666',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 10,
  },
  syncModes: {
    flexDirection: 'row',
    gap: 8,
  },
  syncChip: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  syncChipActive: {
    backgroundColor: '#001a20',
    borderColor: '#00e5ff',
  },
  syncChipIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  syncChipLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
  },
  syncChipLabelActive: {
    color: '#00e5ff',
  },
});
