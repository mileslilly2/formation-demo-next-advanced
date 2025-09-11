import { useEffect, useRef } from 'react';

type TouchButtons = 'firing' | 'leftHeld' | 'rightHeld' | 'fireHeld';

export type TouchState = {
  touchX: number | null;
} & Record<TouchButtons, boolean>;

export default function useTouchControls(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const state = useRef<TouchState>({
    touchX: null,
    firing: false,
    leftHeld: false,
    rightHeld: false,
    fireHeld: false,
  });

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    // gestures
    function handleTouchStart(e: TouchEvent) {
      const rect = c.getBoundingClientRect();
      const t = e.touches[0];
      state.current.touchX = t.clientX - rect.left;
      state.current.firing = (t.clientY - rect.top) > rect.height / 2;
    }
    function handleTouchMove(e: TouchEvent) {
      const rect = c.getBoundingClientRect();
      const t = e.touches[0];
      state.current.touchX = t.clientX - rect.left;
      state.current.firing = (t.clientY - rect.top) > rect.height / 2;
    }
    function handleTouchEnd() {
      state.current.touchX = null;
      state.current.firing = false;
    }

    c.addEventListener('touchstart', handleTouchStart);
    c.addEventListener('touchmove', handleTouchMove);
    c.addEventListener('touchend', handleTouchEnd);

    // virtual buttons
    function attachButton(id: string, key: TouchButtons) {
      const btn = document.getElementById(id);
      if (!btn) return;
      const press = () => { state.current[key] = true; };
      const release = () => { state.current[key] = false; };
      btn.addEventListener('touchstart', press);
      btn.addEventListener('mousedown', press);
      btn.addEventListener('touchend', release);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);
    }
    attachButton('btn-left', 'leftHeld');
    attachButton('btn-right', 'rightHeld');
    attachButton('btn-fire', 'fireHeld');

    return () => {
      c.removeEventListener('touchstart', handleTouchStart);
      c.removeEventListener('touchmove', handleTouchMove);
      c.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canvasRef]);

  return state;
}
