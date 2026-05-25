import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Ellipse,
  Path,
  G,
  Line,
} from 'react-native-svg';
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

const TRUSS_H = 10;
const FIXTURE_R = 9;
const HIT_SLOP = 22;

interface Layout {
  trusses: { x0: number; x1: number; y: number; label: string }[];
  floorY: number;
  backWallY: number;
}

function computeLayout(w: number, h: number, venue: VenueConfig): Layout {
  return {
    floorY: h * venue.floorYPercent,
    backWallY: h * venue.backWallYPercent,
    trusses: venue.trusses.map((t) => ({
      x0: w * t.xStartPercent,
      x1: w * t.xEndPercent,
      y: h * t.yPercent,
      label: t.label,
    })),
  };
}

function getFixturePos(f: PlacedFixture, layout: Layout) {
  const truss = layout.trusses[f.trussIndex];
  if (!truss) return null;
  return { x: truss.x0 + (truss.x1 - truss.x0) * f.position, y: truss.y };
}

function hexColor(r: number, g: number, b: number) {
  return `rgb(${r},${g},${b})`;
}

// Build the SVG path string for a beam cone
function beamPath(fx: number, fy: number, tx: number, ty: number, halfW: number) {
  const len = Math.sqrt((tx - fx) ** 2 + (ty - fy) ** 2);
  if (len < 1) return '';
  const dx = (tx - fx) / len;
  const dy = (ty - fy) / len;
  const px = -dy;
  const py = dx;
  const lx = tx + px * halfW;
  const ly = ty + py * halfW;
  const rx = tx - px * halfW;
  const ry = ty - py * halfW;
  return `M ${fx} ${fy} L ${lx} ${ly} L ${rx} ${ry} Z`;
}

export const StageCanvas: React.FC<Props> = ({
  width, height, venue, fixtures, selectedId, isHazeOn, onTapTruss, onTapFixture, onTapEmpty,
}) => {
  const layout = useMemo(() => computeLayout(width, height, venue), [width, height, venue]);

  const tapGesture = Gesture.Tap().runOnJS(true).onEnd((e) => {
    const { x, y } = e;

    for (const fixture of fixtures) {
      const pos = getFixturePos(fixture, layout);
      if (!pos) continue;
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist <= FIXTURE_R + HIT_SLOP) {
        onTapFixture(fixture.id);
        return;
      }
    }

    for (let i = 0; i < layout.trusses.length; i++) {
      const truss = layout.trusses[i];
      if (
        Math.abs(y - truss.y) <= TRUSS_H / 2 + HIT_SLOP &&
        x >= truss.x0 - HIT_SLOP &&
        x <= truss.x1 + HIT_SLOP
      ) {
        const pos = Math.max(0, Math.min(1, (x - truss.x0) / (truss.x1 - truss.x0)));
        onTapTruss(i, pos);
        return;
      }
    }

    onTapEmpty();
  });

  const gradientDefs = useMemo(() => {
    const defs: React.ReactNode[] = [];
    for (const f of fixtures) {
      if (!f.isOn) continue;
      const pos = getFixturePos(f, layout);
      if (!pos) continue;
      const { r, g, b } = f.color;
      const color = hexColor(r, g, b);

      const isMoving = f.type === 'moving-head-spot' || f.type === 'moving-head-wash' || f.type === 'laser';
      let tx = pos.x, ty = layout.floorY;
      if (isMoving) {
        tx = pos.x + f.pan * width * 0.38;
      }

      // Beam gradient: tip → transparent
      defs.push(
        <LinearGradient
          key={`bg-${f.id}`}
          id={`bg-${f.id}`}
          x1={pos.x} y1={pos.y} x2={tx} y2={ty}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor={color} stopOpacity={f.intensity * 0.88} />
          <Stop offset="55%" stopColor={color} stopOpacity={f.intensity * 0.28} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      );

      // Outer haze gradient
      defs.push(
        <LinearGradient
          key={`hg-${f.id}`}
          id={`hg-${f.id}`}
          x1={pos.x} y1={pos.y} x2={tx} y2={ty}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor={color} stopOpacity={f.intensity * (isHazeOn ? 0.55 : 0.28)} />
          <Stop offset="45%" stopColor={color} stopOpacity={f.intensity * 0.1} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      );

      // Floor spot radial gradient
      const spotR = Math.max(
        16,
        (layout.floorY - pos.y) * Math.tan(((f.beamAngle / 2) * Math.PI) / 180) * 0.9
      );
      defs.push(
        <RadialGradient
          key={`sg-${f.id}`}
          id={`sg-${f.id}`}
          cx={tx}
          cy={ty}
          r={spotR}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor={color} stopOpacity={f.intensity * 0.65} />
          <Stop offset="50%" stopColor={color} stopOpacity={f.intensity * 0.25} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      );
    }
    return defs;
  }, [fixtures, layout, width, isHazeOn]);

  return (
    <GestureDetector gesture={tapGesture}>
      <View style={{ width, height }}>
        <Svg width={width} height={height}>
          <Defs>{gradientDefs}</Defs>

          {/* ── BACKGROUND ── */}
          <Rect x={0} y={0} width={width} height={height} fill={venue.ambientColor} />

          {/* Back wall */}
          <Rect
            x={width * 0.02}
            y={layout.backWallY}
            width={width * 0.96}
            height={layout.floorY - layout.backWallY}
            fill={venue.wallColor}
          />

          {/* Stage floor */}
          <Path
            d={`M ${width * 0.02} ${layout.floorY} L ${width * 0.98} ${layout.floorY} L ${width + 20} ${height} L -20 ${height} Z`}
            fill={venue.floorColor}
          />
          {/* Floor edge highlight */}
          <Line
            x1={width * 0.02} y1={layout.floorY}
            x2={width * 0.98} y2={layout.floorY}
            stroke="#ffffff14" strokeWidth={1.5}
          />

          {/* ── LIGHT BEAMS ── */}
          {fixtures.map((f) => {
            if (!f.isOn || f.intensity < 0.01) return null;
            const pos = getFixturePos(f, layout);
            if (!pos) return null;
            const { r, g, b } = f.color;
            const color = hexColor(r, g, b);

            const isMoving = f.type === 'moving-head-spot' || f.type === 'moving-head-wash' || f.type === 'laser';
            let tx = pos.x, ty = layout.floorY;
            if (isMoving) {
              tx = pos.x + f.pan * width * 0.38;
            }

            if (f.type === 'laser') {
              return (
                <G key={f.id}>
                  {/* Glow halo */}
                  <Line x1={pos.x} y1={pos.y} x2={tx} y2={ty} stroke={color} strokeWidth={8} opacity={f.intensity * 0.12} />
                  {/* Bright core */}
                  <Line x1={pos.x} y1={pos.y} x2={tx} y2={ty} stroke={color} strokeWidth={2} opacity={f.intensity * 0.95} />
                  {/* End dot */}
                  <Circle cx={tx} cy={ty} r={5} fill={color} opacity={f.intensity * 0.5} />
                </G>
              );
            }

            if (f.type === 'led-bar') {
              const segments = 5;
              const segW = 16;
              return (
                <G key={f.id}>
                  {Array.from({ length: segments }).map((_, i) => {
                    const segX = pos.x - (segW * segments) / 2 + i * segW + segW / 2;
                    const spreadAngle = ((i - (segments - 1) / 2) / segments) * 60;
                    const rad = (spreadAngle * Math.PI) / 180;
                    const len = layout.floorY - pos.y;
                    const stx = segX + len * Math.sin(rad);
                    const sty = layout.floorY;
                    const hw = 5;
                    return (
                      <Path
                        key={i}
                        d={`M ${segX} ${pos.y} L ${stx - hw} ${sty} L ${stx + hw} ${sty} Z`}
                        fill={color}
                        opacity={f.intensity * 0.55}
                      />
                    );
                  })}
                </G>
              );
            }

            const beamAngleRad = (f.beamAngle * Math.PI) / 180;
            const len = Math.sqrt((tx - pos.x) ** 2 + (ty - pos.y) ** 2);
            const halfW = len * Math.tan(beamAngleRad / 2);
            const innerHalfW = halfW * 0.18;

            const outerD = beamPath(pos.x, pos.y, tx, ty, halfW * 1.5);
            const midD = beamPath(pos.x, pos.y, tx, ty, halfW);
            const coreD = beamPath(pos.x, pos.y, tx, ty, innerHalfW);

            const spotRx = halfW * 0.85;
            const spotRy = Math.max(8, halfW * 0.3);

            return (
              <G key={f.id}>
                {/* Outer soft haze */}
                <Path d={outerD} fill={`url(#hg-${f.id})`} />
                {/* Mid beam */}
                <Path d={midD} fill={`url(#bg-${f.id})`} />
                {/* Bright core */}
                <Path d={coreD} fill={color} opacity={f.intensity * 0.7} />
                {/* Floor spot */}
                <Ellipse cx={tx} cy={ty} rx={spotRx} ry={spotRy} fill={`url(#sg-${f.id})`} />
              </G>
            );
          })}

          {/* ── TRUSSES ── */}
          {layout.trusses.map((truss, i) => (
            <G key={i}>
              {/* Rigging cables */}
              <Line x1={truss.x0 + 16} y1={0} x2={truss.x0 + 16} y2={truss.y - TRUSS_H / 2} stroke="#1e1e1e" strokeWidth={1} />
              <Line x1={truss.x1 - 16} y1={0} x2={truss.x1 - 16} y2={truss.y - TRUSS_H / 2} stroke="#1e1e1e" strokeWidth={1} />
              {/* Truss body */}
              <Rect x={truss.x0} y={truss.y - TRUSS_H / 2} width={truss.x1 - truss.x0} height={TRUSS_H} fill="#252525" />
              {/* Top highlight */}
              <Rect x={truss.x0} y={truss.y - TRUSS_H / 2} width={truss.x1 - truss.x0} height={2} fill="#484848" />
            </G>
          ))}

          {/* ── FIXTURE ICONS ── */}
          {fixtures.map((f) => {
            const pos = getFixturePos(f, layout);
            if (!pos) return null;
            const { r, g, b } = f.color;
            const color = hexColor(r, g, b);
            const isSelected = f.id === selectedId;

            return (
              <G key={f.id}>
                {/* Outer glow rings (layered to simulate blur) */}
                {f.isOn && (
                  <>
                    <Circle cx={pos.x} cy={pos.y} r={22} fill={color} opacity={f.intensity * 0.06} />
                    <Circle cx={pos.x} cy={pos.y} r={16} fill={color} opacity={f.intensity * 0.12} />
                    <Circle cx={pos.x} cy={pos.y} r={12} fill={color} opacity={f.intensity * 0.2} />
                  </>
                )}
                {/* Selection ring */}
                {isSelected && (
                  <Circle cx={pos.x} cy={pos.y} r={FIXTURE_R + 5} fill="none" stroke="#00e5ff" strokeWidth={1.5} opacity={0.7} />
                )}
                {/* Housing */}
                <Circle cx={pos.x} cy={pos.y} r={FIXTURE_R} fill="#1c1c1c" />
                <Circle cx={pos.x} cy={pos.y} r={FIXTURE_R} fill="none" stroke="#3a3a3a" strokeWidth={1} />
                {/* Lens */}
                <Circle cx={pos.x} cy={pos.y} r={FIXTURE_R - 3} fill={color} opacity={f.isOn ? f.intensity : 0.2} />

                {/* Moving head direction bar */}
                {(f.type === 'moving-head-spot' || f.type === 'moving-head-wash') && (
                  <Line
                    x1={pos.x}
                    y1={pos.y}
                    x2={pos.x + Math.sin(f.pan * 0.6) * 13}
                    y2={pos.y + Math.cos(f.pan * 0.6) * 13}
                    stroke="#ffffff60"
                    strokeWidth={2}
                  />
                )}
              </G>
            );
          })}
        </Svg>
      </View>
    </GestureDetector>
  );
};

export default StageCanvas;
