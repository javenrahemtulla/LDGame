import { create } from 'zustand';
import { PlacedFixture, FixtureType, FixtureColor, SyncMode, VenueId } from '../types';
import { FIXTURE_DEFINITIONS } from '../constants/fixtures';
import { VENUE_CONFIGS } from '../constants/venues';

let nextId = 1;

interface StageState {
  venueId: VenueId;
  fixtures: PlacedFixture[];
  selectedFixtureId: string | null;
  syncMode: SyncMode;
  beatColorIndex: number;
  chaseIndex: number;
  isHazeOn: boolean;

  setVenue: (id: VenueId) => void;
  addFixture: (type: FixtureType, trussIndex: number, position: number) => void;
  removeFixture: (id: string) => void;
  selectFixture: (id: string | null) => void;
  updateFixture: (id: string, updates: Partial<PlacedFixture>) => void;
  toggleFixture: (id: string) => void;
  setFixtureColor: (id: string, color: FixtureColor) => void;
  setFixtureIntensity: (id: string, intensity: number) => void;
  setFixturePan: (id: string, pan: number) => void;
  setFixtureTilt: (id: string, tilt: number) => void;
  setSyncMode: (mode: SyncMode) => void;
  toggleHaze: () => void;
  triggerBeat: (intensity: number) => void;
  allLightsOn: () => void;
  allLightsOff: () => void;
  blackout: () => void;
}

export const useStageStore = create<StageState>((set, get) => ({
  venueId: 'club',
  fixtures: [],
  selectedFixtureId: null,
  syncMode: 'off',
  beatColorIndex: 0,
  chaseIndex: 0,
  isHazeOn: false,

  setVenue: (id) => set({ venueId: id, fixtures: [], selectedFixtureId: null }),

  addFixture: (type, trussIndex, position) => {
    const def = FIXTURE_DEFINITIONS[type];
    const fixture: PlacedFixture = {
      id: `f${nextId++}`,
      type,
      trussIndex,
      position,
      color: { ...def.defaultColor },
      intensity: 0.85,
      pan: 0,
      tilt: 0.5,
      isOn: true,
      beamAngle: def.beamAngle,
      strobeRate: type === 'strobe' ? 0.5 : 0,
    };
    set((s) => ({ fixtures: [...s.fixtures, fixture] }));
  },

  removeFixture: (id) =>
    set((s) => ({
      fixtures: s.fixtures.filter((f) => f.id !== id),
      selectedFixtureId: s.selectedFixtureId === id ? null : s.selectedFixtureId,
    })),

  selectFixture: (id) => set({ selectedFixtureId: id }),

  updateFixture: (id, updates) =>
    set((s) => ({
      fixtures: s.fixtures.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),

  toggleFixture: (id) =>
    set((s) => ({
      fixtures: s.fixtures.map((f) => (f.id === id ? { ...f, isOn: !f.isOn } : f)),
    })),

  setFixtureColor: (id, color) =>
    set((s) => ({
      fixtures: s.fixtures.map((f) => (f.id === id ? { ...f, color } : f)),
    })),

  setFixtureIntensity: (id, intensity) =>
    set((s) => ({
      fixtures: s.fixtures.map((f) => (f.id === id ? { ...f, intensity } : f)),
    })),

  setFixturePan: (id, pan) =>
    set((s) => ({
      fixtures: s.fixtures.map((f) => (f.id === id ? { ...f, pan } : f)),
    })),

  setFixtureTilt: (id, tilt) =>
    set((s) => ({
      fixtures: s.fixtures.map((f) => (f.id === id ? { ...f, tilt } : f)),
    })),

  setSyncMode: (mode) => set({ syncMode: mode }),

  toggleHaze: () => set((s) => ({ isHazeOn: !s.isHazeOn })),

  triggerBeat: (intensity) => {
    const { syncMode, fixtures, beatColorIndex, chaseIndex } = get();
    if (syncMode === 'off') return;

    const activeFixtures = fixtures.filter((f) => f.isOn);
    if (activeFixtures.length === 0) return;

    if (syncMode === 'beat-flash') {
      set((s) => ({
        fixtures: s.fixtures.map((f) =>
          f.isOn ? { ...f, intensity: Math.min(1, f.intensity + 0.4 * intensity) } : f
        ),
      }));
      setTimeout(() => {
        set((s) => ({
          fixtures: s.fixtures.map((f) => (f.isOn ? { ...f, intensity: f.intensity * 0.6 } : f)),
        }));
      }, 80);
    } else if (syncMode === 'color-cycle') {
      const { BEAT_COLOR_CYCLE } = require('../constants/fixtures');
      const nextIndex = (beatColorIndex + 1) % BEAT_COLOR_CYCLE.length;
      const nextColor = BEAT_COLOR_CYCLE[nextIndex];
      set((s) => ({
        beatColorIndex: nextIndex,
        fixtures: s.fixtures.map((f) => (f.isOn ? { ...f, color: nextColor } : f)),
      }));
    } else if (syncMode === 'chase') {
      const nextChase = (chaseIndex + 1) % Math.max(1, activeFixtures.length);
      set((s) => ({
        chaseIndex: nextChase,
        fixtures: s.fixtures.map((f, i) => {
          const activeIdx = activeFixtures.indexOf(f);
          return activeIdx >= 0 ? { ...f, intensity: activeIdx === nextChase ? 1 : 0.1 } : f;
        }),
      }));
    } else if (syncMode === 'pulse') {
      set((s) => ({
        fixtures: s.fixtures.map((f) =>
          f.isOn ? { ...f, intensity: 0.2 + intensity * 0.8 } : f
        ),
      }));
    }
  },

  allLightsOn: () =>
    set((s) => ({ fixtures: s.fixtures.map((f) => ({ ...f, isOn: true, intensity: 0.85 })) })),

  allLightsOff: () =>
    set((s) => ({ fixtures: s.fixtures.map((f) => ({ ...f, isOn: false })) })),

  blackout: () =>
    set((s) => ({
      fixtures: s.fixtures.map((f) => ({ ...f, isOn: false })),
    })),
}));
