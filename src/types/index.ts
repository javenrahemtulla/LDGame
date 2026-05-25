export type FixtureType =
  | 'par'
  | 'moving-head-spot'
  | 'moving-head-wash'
  | 'led-bar'
  | 'strobe'
  | 'laser';

export type VenueId =
  | 'club'
  | 'concert'
  | 'theater'
  | 'bar'
  | 'festival'
  | 'church';

export type SyncMode = 'beat-flash' | 'color-cycle' | 'chase' | 'pulse' | 'off';

export interface FixtureColor {
  r: number;
  g: number;
  b: number;
}

export interface PlacedFixture {
  id: string;
  type: FixtureType;
  trussIndex: number;
  position: number; // 0-1 along truss
  color: FixtureColor;
  intensity: number; // 0-1
  pan: number; // -1 to 1 (moving heads)
  tilt: number; // 0-1
  isOn: boolean;
  beamAngle: number;
  strobeRate: number; // 0-1
}

export interface TrussConfig {
  yPercent: number; // 0-1 from ceiling to mid-stage
  xStartPercent: number;
  xEndPercent: number;
  label: string;
}

export interface VenueConfig {
  id: VenueId;
  name: string;
  description: string;
  emoji: string;
  trusses: TrussConfig[];
  floorYPercent: number;
  backWallYPercent: number;
  ambientColor: string;
  floorColor: string;
  wallColor: string;
  maxFixtures: number;
}

export interface FixtureDefinition {
  type: FixtureType;
  name: string;
  description: string;
  beamAngle: number;
  canMove: boolean;
  isStrobe: boolean;
  isLaser: boolean;
  defaultColor: FixtureColor;
  icon: string;
  accentColor: string;
}

export interface BeatEvent {
  timestamp: number;
  intensity: number;
}
