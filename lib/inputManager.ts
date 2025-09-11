import { RefObject } from 'react';
import useKeyControls from '../hooks/useKeyControls';
import useTouchControls from '../hooks/useTouchControls';

export type Input = { move: number; fire: boolean };

/**
 * Custom hook that unifies keyboard + touch controls.
 * Call this once at the top of your component.
 */
export function useInput(
  canvasRef: RefObject<HTMLCanvasElement>,
  getPlayerX: () => number
): () => Input {
  const keys = useKeyControls();
  const touch = useTouchControls(canvasRef);

  return () => {
    let move = 0;
    let fire = false;

    // --- Virtual buttons
    if (touch.current.leftHeld) move -= 1;
    if (touch.current.rightHeld) move += 1;
    if (touch.current.fireHeld) fire = true;

    // --- Touch gestures
    if (touch.current.touchX !== null) {
      const dx = touch.current.touchX - getPlayerX();
      if (Math.abs(dx) > 5) move = dx > 0 ? 1 : -1;
      fire = touch.current.firing || fire;
    }

    // --- Keyboard fallback (desktop)
    if (!('ontouchstart' in window)) {
      const left = keys.current['arrowleft'] || keys.current['a'];
      const right = keys.current['arrowright'] || keys.current['d'];
      fire =
        fire ||
        keys.current[' '] ||
        keys.current['space'] ||
        keys.current['arrowup'] ||
        keys.current['w'];
      move = move || ((right ? 1 : 0) - (left ? 1 : 0));
    }

    return { move, fire };
  };
}
