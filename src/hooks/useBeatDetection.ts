import { useRef, useCallback } from 'react';

const WINDOW_SIZE = 20;
const BEAT_THRESHOLD_MULTIPLIER = 1.4;
const MIN_BEAT_INTERVAL_MS = 250;

export function useBeatDetection(onBeat: (intensity: number) => void) {
  const historyRef = useRef<number[]>([]);
  const lastBeatTimeRef = useRef<number>(0);

  const processMeter = useCallback(
    (meteringDBFS: number, isPlaying: boolean) => {
      if (!isPlaying) return;

      // Convert dBFS to linear (0-1)
      const linear = Math.pow(10, meteringDBFS / 20);
      const amplitude = Math.max(0, Math.min(1, linear * 3));

      const history = historyRef.current;
      history.push(amplitude);
      if (history.length > WINDOW_SIZE) history.shift();
      if (history.length < 4) return;

      const avg = history.slice(0, -1).reduce((a, b) => a + b, 0) / (history.length - 1);
      const current = amplitude;
      const now = Date.now();

      const isBeat =
        current > avg * BEAT_THRESHOLD_MULTIPLIER &&
        current > 0.1 &&
        now - lastBeatTimeRef.current > MIN_BEAT_INTERVAL_MS;

      if (isBeat) {
        lastBeatTimeRef.current = now;
        const beatIntensity = Math.min(1, (current - avg) / avg);
        onBeat(beatIntensity);
      }
    },
    [onBeat]
  );

  return { processMeter };
}
