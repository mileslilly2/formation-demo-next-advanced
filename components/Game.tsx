'use client';
import dynamic from 'next/dynamic';

// Dynamically import PhaserGame, disable SSR
const PhaserGame = dynamic(() => import('./PhaserGame'), { ssr: false });

export default function Game() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <PhaserGame />
    </div>
  );
}
