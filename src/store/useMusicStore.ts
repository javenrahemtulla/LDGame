import { create } from 'zustand';
import { Audio } from 'expo-av';

interface MusicState {
  sound: Audio.Sound | null;
  trackName: string | null;
  trackUri: string | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  metering: number; // dBFS, typically -160 to 0
  isLoading: boolean;
  error: string | null;

  loadTrack: (uri: string, name: string, onStatus: (metering: number, isPlaying: boolean) => void) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  setMetering: (value: number) => void;
  setPosition: (positionMs: number, durationMs: number) => void;
  unload: () => Promise<void>;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  sound: null,
  trackName: null,
  trackUri: null,
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  metering: -160,
  isLoading: false,
  error: null,

  loadTrack: async (uri, name, onStatus) => {
    const prev = get().sound;
    if (prev) {
      await prev.unloadAsync();
    }
    set({ isLoading: true, error: null, trackName: name, trackUri: uri });
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, isMeteringEnabled: true, progressUpdateIntervalMillis: 50 } as any
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        const metering = (status as any).metering ?? -160;
        set({
          positionMs: status.positionMillis ?? 0,
          durationMs: status.durationMillis ?? 0,
          isPlaying: status.isPlaying,
          metering,
        });
        onStatus(metering, status.isPlaying);
      });
      set({ sound, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message ?? 'Failed to load track' });
    }
  },

  play: async () => {
    const { sound } = get();
    if (sound) await sound.playAsync();
  },

  pause: async () => {
    const { sound } = get();
    if (sound) await sound.pauseAsync();
  },

  stop: async () => {
    const { sound } = get();
    if (sound) {
      await sound.stopAsync();
      set({ positionMs: 0, isPlaying: false });
    }
  },

  seekTo: async (ms) => {
    const { sound } = get();
    if (sound) await sound.setPositionAsync(ms);
  },

  setMetering: (value) => set({ metering: value }),

  setPosition: (positionMs, durationMs) => set({ positionMs, durationMs }),

  unload: async () => {
    const { sound } = get();
    if (sound) await sound.unloadAsync();
    set({ sound: null, trackName: null, trackUri: null, isPlaying: false, positionMs: 0, durationMs: 0 });
  },
}));
