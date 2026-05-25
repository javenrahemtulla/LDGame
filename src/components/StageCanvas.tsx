import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  Canvas,
  Group,
  Rect,
  Circle,
  Path,
  Skia,
  LinearGradient,
  RadialGradient,
  vec,
  BlurMask,
  Paint,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { PlacedFixture, VenueConfig } from '../types';

interface Props {
  width: number;
  height: number;
  venue: VenueConfig;
  fixtures: PlacedFixture[];
  selectedId: string | null;
  isHazeOn: boolean;
  onTapTruss: (trussIndex: number, position: number) => void;
  onTapFixture: (id: string) => void;
  onTapEmpty: () => void;
}

const TRUSS_HEIGHT = 10;
const FIXTURE_RADIUS = 9;
const HIT_SLOP = 24;

function toRgba(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${a})`;
}

function toHex(r: number, g: number, b: number) {
  return `rgb(${r},${g},${b})`;
}

interface Layout {
  trusses: { x0: number; x1: number; y: number; label: string }[];
  floorY: number;
  backWallY: number;
  stageLeft: number;
  stageRight: number;
}

function computeLayout(width: number, height: number, venue: VenueConfig): Layout {
  const stageLeft = width * 0.02;
  const stageRight = width * 0.98;
  const floorY = height * venue.floorYPercent;
  const backWallY = height * venue.backWallYPercent;

  const trusses = venue.trusses.map((t) => ({
    x0: width * t.xStartPercent,
    x1: width * t.xEndPercent,
    y: height * t.yPercent,
    label: t.label,
  }));

  return { trusses, floorY, backWallY, stageLeft, stageRight };
}

function getFixturePosition(fixture: PlacedFixture, layout: Layout) {
  const truss = layout.trusses[fixture.trussIndex];
  if (!truss) return null;
  const x = truss.x0 + (truss.x1 - truss.x0) * fixture.position;
  const y = truss.y;
  return { x, y };
}

const StageBackground: React.FC<{ width: number; height: number; venue: VenueConfig; layout: Layout; isHazeOn: boolean }> = ({
  width, height, venue, layout, isHazeOn,
}) => {
  const bgPath = Skia.Path.Make();
  bgPath.addRect(Skia.XYWHRect(0, 0, width, height));

  const floorPath = Skia.Path.Make();
  floorPath.moveTo(layout.stageLeft, layout.floorY);
  floorPath.lineTo(layout.stageRight, layout.floorY);
  floorPath.lineTo(layout.stageRight + 20, height);
  floorPath.lineTo(layout.stageLeft - 20, height);
  floorPath.close();

  return (
    <>
      {/* Sky / ceiling */}
      <Rect x={0} y={0} width={width} height={height} color={venue.ambientColor} />

      {/* Back wall gradient */}
      <Rect x={layout.stageLeft} y={layout.backWallY} width={layout.stageRight - layout.stageLeft} height={layout.floorY - layout.backWallY}>
        <LinearGradient
          start={vec(width / 2, layout.backWallY)}
          end={vec(width / 2, layout.floorY)}
          colors={[venue.wallColor, venue.floorColor]}
        />
      </Rect>

      {/* Stage floor with slight reflection */}
      <Path path={floorPath}>
        <LinearGradient
          start={vec(width / 2, layout.floorY)}
          end={vec(width / 2, height)}
          colors={[venue.floorColor, '#050505']}
        />
      </Path>

      {/* Floor edge highlight */}
      <Rect x={layout.stageLeft} y={layout.floorY - 1} width={layout.stageRight - layout.stageLeft} height={2} color="#ffffff18" />

      {/* Haze overlay */}
      {isHazeOn && (
        <Rect x={0} y={0} width={width} height={height} opacity={0.06} color="#8888ff">
          <BlurMask blur={30} style="normal" />
        </Rect>
      )}
    </>
  );
};

const Truss: React.FC<{ x0: number; x1: number; y: number; width: number }> = ({ x0, x1, y, width: w }) => {
  return (
    <>
      {/* Truss body */}
      <Rect x={x0} y={y - TRUSS_HEIGHT / 2} width={x1 - x0} height={TRUSS_HEIGHT} color="#2a2a2a" />
      {/* Truss highlight */}
      <Rect x={x0} y={y - TRUSS_HEIGHT / 2} width={x1 - x0} height={2} color="#505050" />
      {/* Rigging lines from ceiling */}
      {[x0 + 10, x1 - 10].map((rx, i) => (
        <Rect key={i} x={rx - 0.5} y={0} width={1} height={y - TRUSS_HEIGHT / 2} color="#222222" />
      ))}
    </>
  );
};

const FixtureBeam: React.FC<{ fixture: PlacedFixture; fx: number; fy: number; layout: Layout; canvasWidth: number; isHaze: boolean }> = ({
  fixture, fx, fy, layout, canvasWidth, isHaze,
}) => {
  if (!fixture.isOn || fixture.intensity < 0.01) return null;

  const { r, g, b } = fixture.color;
  const intensity = fixture.intensity;
  const isMoving = fixture.type === 'moving-head-spot' || fixture.type === 'moving-head-wash' || fixture.type === 'laser';

  let targetX = fx;
  let targetY = layout.floorY;

  if (isMoving) {
    const maxPan = canvasWidth * 0.38;
    targetX = fx + fixture.pan * maxPan;
    const maxTiltOffset = (layout.floorY - fy) * 0.15;
    targetY = layout.floorY - maxTiltOffset + fixture.tilt * maxTiltOffset * 2;
  }

  const beamAngleRad = (fixture.beamAngle * Math.PI) / 180;
  const beamLen = Math.sqrt((targetX - fx) ** 2 + (targetY - fy) ** 2);
  const halfW = beamLen * Math.tan(beamAngleRad / 2);

  // Beam direction vector (normalized)
  const dx = (targetX - fx) / beamLen;
  const dy = (targetY - fy) / beamLen;
  // Perpendicular
  const px = -dy;
  const py = dx;

  // Cone tip at fixture, base centered at target
  const path = Skia.Path.Make();
  path.moveTo(fx, fy);
  path.lineTo(targetX + px * halfW, targetY + py * halfW);
  path.lineTo(targetX - px * halfW, targetY - py * halfW);
  path.close();

  // Haze inner beam (narrower)
  const innerW = halfW * 0.15;
  const innerPath = Skia.Path.Make();
  innerPath.moveTo(fx, fy);
  innerPath.lineTo(targetX + px * innerW, targetY + py * innerW);
  innerPath.lineTo(targetX - px * innerW, targetY - py * innerW);
  innerPath.close();

  // Floor spot (oval)
  const spotRx = halfW * 0.85;
  const spotRy = halfW * 0.3 + 4;
  const spotPath = Skia.Path.Make();
  spotPath.addOval(Skia.XYWHRect(targetX - spotRx, targetY - spotRy, spotRx * 2, spotRy * 2));

  // Laser has a special thin bright beam
  if (fixture.type === 'laser') {
    const laserPath = Skia.Path.Make();
    laserPath.moveTo(fx, fy);
    laserPath.lineTo(targetX, targetY);
    return (
      <Group blendMode="screen">
        <Path path={laserPath} style="stroke" strokeWidth={2} color={toHex(r, g, b)} opacity={intensity}>
          <BlurMask blur={3} style="solid" />
        </Path>
        <Circle cx={targetX} cy={targetY} r={6} color={toHex(r, g, b)} opacity={intensity * 0.6}>
          <BlurMask blur={8} style="normal" />
        </Circle>
      </Group>
    );
  }

  const alphaOuter = Math.round(intensity * (isHaze ? 0.55 : 0.38) * 255).toString(16).padStart(2, '0');
  const alphaMid = Math.round(intensity * 0.18 * 255).toString(16).padStart(2, '0');

  return (
    <Group blendMode="screen">
      {/* Outer soft beam */}
      <Path path={path} opacity={1}>
        <LinearGradient
          start={vec(fx, fy)}
          end={vec(targetX, targetY)}
          colors={[
            toRgba(r, g, b, intensity * (isHaze ? 0.7 : 0.5)),
            toRgba(r, g, b, intensity * 0.25),
            toRgba(r, g, b, 0),
          ]}
          positions={[0, 0.55, 1]}
        />
        <BlurMask blur={isHaze ? 8 : 4} style="normal" />
      </Path>

      {/* Inner bright core */}
      <Path path={innerPath} opacity={intensity}>
        <LinearGradient
          start={vec(fx, fy)}
          end={vec(targetX, targetY)}
          colors={[toRgba(r, g, b, 0.95), toRgba(r, g, b, 0.4), toRgba(r, g, b, 0)]}
          positions={[0, 0.5, 1]}
        />
      </Path>

      {/* Floor spot */}
      <Path path={spotPath} opacity={intensity * 0.7}>
        <RadialGradient
          c={vec(targetX, targetY)}
          r={Math.max(spotRx, spotRy)}
          colors={[toRgba(r, g, b, 0.7), toRgba(r, g, b, 0.3), toRgba(r, g, b, 0)]}
          positions={[0, 0.5, 1]}
        />
        <BlurMask blur={6} style="normal" />
      </Path>
    </Group>
  );
};

const FixtureIcon: React.FC<{ fixture: PlacedFixture; fx: number; fy: number; isSelected: boolean }> = ({
  fixture, fx, fy, isSelected,
}) => {
  const { r, g, b } = fixture.color;
  const isOn = fixture.isOn;

  const bodyColor = isOn ? toHex(r, g, b) : '#333333';
  const glowRadius = isOn ? 14 : 0;

  return (
    <Group>
      {/* Glow halo when on */}
      {isOn && (
        <Circle cx={fx} cy={fy} r={glowRadius} color={toRgba(r, g, b, 0.35)}>
          <BlurMask blur={8} style="normal" />
        </Circle>
      )}

      {/* Selection ring */}
      {isSelected && (
        <Circle cx={fx} cy={fy} r={FIXTURE_RADIUS + 4} color="#00e5ff40" style="stroke" strokeWidth={2} />
      )}

      {/* Fixture housing */}
      <Circle cx={fx} cy={fy} r={FIXTURE_RADIUS} color="#1a1a1a" />
      <Circle cx={fx} cy={fy} r={FIXTURE_RADIUS - 1} color="#2a2a2a" style="stroke" strokeWidth={1} />

      {/* Fixture lens */}
      <Circle cx={fx} cy={fy} r={FIXTURE_RADIUS - 3} color={bodyColor} opacity={isOn ? 1 : 0.3} />

      {/* Moving head direction indicator */}
      {(fixture.type === 'moving-head-spot' || fixture.type === 'moving-head-wash') && (
        <Path
          path={(() => {
            const p = Skia.Path.Make();
            const ang = fixture.pan * 0.6;
            const ex = fx + Math.sin(ang) * 12;
            const ey = fy + Math.cos(ang) * 12;
            p.moveTo(fx, fy);
            p.lineTo(ex, ey);
            return p;
          })()}
          style="stroke"
          strokeWidth={2}
          color="#ffffff80"
        />
      )}
    </Group>
  );
};

const StrobeFlash: React.FC<{ fixture: PlacedFixture; fx: number; fy: number; layout: Layout; canvasWidth: number }> = ({
  fixture, fx, fy, layout, canvasWidth,
}) => {
  if (!fixture.isOn || fixture.intensity < 0.01) return null;

  const flashPath = Skia.Path.Make();
  const beamAngleRad = (fixture.beamAngle * Math.PI) / 180;
  const beamLen = layout.floorY - fy;
  const halfW = beamLen * Math.tan(beamAngleRad / 2);
  flashPath.moveTo(fx, fy);
  flashPath.lineTo(fx - halfW, layout.floorY);
  flashPath.lineTo(fx + halfW, layout.floorY);
  flashPath.close();

  return (
    <Group blendMode="screen">
      <Path path={flashPath} opacity={fixture.intensity * 0.9}>
        <LinearGradient
          start={vec(fx, fy)}
          end={vec(fx, layout.floorY)}
          colors={[
            toRgba(255, 255, 255, 0.95),
            toRgba(255, 255, 255, 0.5),
            toRgba(255, 255, 255, 0),
          ]}
          positions={[0, 0.4, 1]}
        />
        <BlurMask blur={6} style="normal" />
      </Path>
    </Group>
  );
};

const LedBarBeam: React.FC<{ fixture: PlacedFixture; fx: number; fy: number; layout: Layout; canvasWidth: number }> = ({
  fixture, fx, fy, layout, canvasWidth,
}) => {
  if (!fixture.isOn || fixture.intensity < 0.01) return null;
  const { r, g, b } = fixture.color;
  const segments = 5;
  const segWidth = 18;
  const totalWidth = segWidth * segments;

  return (
    <Group blendMode="screen">
      {Array.from({ length: segments }).map((_, i) => {
        const segX = fx - totalWidth / 2 + i * segWidth + segWidth / 2;
        const segAngle = ((i - (segments - 1) / 2) / segments) * 70;
        const segAngleRad = (segAngle * Math.PI) / 180;
        const beamLen = layout.floorY - fy;
        const tx = segX + beamLen * Math.sin(segAngleRad);
        const ty = layout.floorY;
        const innerW = 4;
        const p = Skia.Path.Make();
        p.moveTo(segX, fy);
        p.lineTo(tx - innerW, ty);
        p.lineTo(tx + innerW, ty);
        p.close();
        const hue = (i / segments) * 60;
        return (
          <Path key={i} path={p} opacity={fixture.intensity * 0.7}>
            <LinearGradient
              start={vec(segX, fy)}
              end={vec(tx, ty)}
              colors={[toRgba(r, g, b, 0.9), toRgba(r, g, b, 0)]}
            />
            <BlurMask blur={3} style="normal" />
          </Path>
        );
      })}
    </Group>
  );
};

export const StageCanvas: React.FC<Props> = ({
  width, height, venue, fixtures, selectedId, isHazeOn, onTapTruss, onTapFixture, onTapEmpty,
}) => {
  const layout = useMemo(() => computeLayout(width, height, venue), [width, height, venue]);

  const tapGesture = Gesture.Tap().runOnJS(true).onEnd((e) => {
    const { x, y } = e;

    // Check if tapping a fixture
    for (const fixture of fixtures) {
      const pos = getFixturePosition(fixture, layout);
      if (!pos) continue;
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist <= FIXTURE_RADIUS + HIT_SLOP) {
        onTapFixture(fixture.id);
        return;
      }
    }

    // Check if tapping a truss
    for (let i = 0; i < layout.trusses.length; i++) {
      const truss = layout.trusses[i];
      if (
        Math.abs(y - truss.y) <= TRUSS_HEIGHT / 2 + HIT_SLOP &&
        x >= truss.x0 - HIT_SLOP &&
        x <= truss.x1 + HIT_SLOP
      ) {
        const position = Math.max(0, Math.min(1, (x - truss.x0) / (truss.x1 - truss.x0)));
        onTapTruss(i, position);
        return;
      }
    }

    onTapEmpty();
  });

  return (
    <GestureDetector gesture={tapGesture}>
      <Canvas style={{ width, height }}>
        {/* Background */}
        <StageBackground width={width} height={height} venue={venue} layout={layout} isHazeOn={isHazeOn} />

        {/* Light beams (drawn before fixture icons so icons appear on top) */}
        {fixtures.map((fixture) => {
          const pos = getFixturePosition(fixture, layout);
          if (!pos) return null;
          if (fixture.type === 'strobe') {
            return <StrobeFlash key={fixture.id} fixture={fixture} fx={pos.x} fy={pos.y} layout={layout} canvasWidth={width} />;
          }
          if (fixture.type === 'led-bar') {
            return <LedBarBeam key={fixture.id} fixture={fixture} fx={pos.x} fy={pos.y} layout={layout} canvasWidth={width} />;
          }
          return (
            <FixtureBeam key={fixture.id} fixture={fixture} fx={pos.x} fy={pos.y} layout={layout} canvasWidth={width} isHaze={isHazeOn} />
          );
        })}

        {/* Trusses */}
        {layout.trusses.map((truss, i) => (
          <Truss key={i} x0={truss.x0} x1={truss.x1} y={truss.y} width={width} />
        ))}

        {/* Fixture icons */}
        {fixtures.map((fixture) => {
          const pos = getFixturePosition(fixture, layout);
          if (!pos) return null;
          return (
            <FixtureIcon key={fixture.id} fixture={fixture} fx={pos.x} fy={pos.y} isSelected={fixture.id === selectedId} />
          );
        })}
      </Canvas>
    </GestureDetector>
  );
};

export default StageCanvas;
