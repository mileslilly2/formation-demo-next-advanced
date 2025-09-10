// components/Game.tsx
'use client';
import React, { useState } from 'react';
import HUD from './HUD';
import GameCanvas from './GameCanvas';

export default function Game() {
  const [selectedFormationFile, setSelectedFormationFile] = useState<string>('');
  return (
    <>
      <HUD selected={selectedFormationFile} onSelect={(f)=>setSelectedFormationFile(f)} />
      <div style={{padding: 16}}>
        <div style={{width: '100%', aspectRatio:'16/9', border:'1px solid #223'}}>
          <GameCanvas selectedFile={selectedFormationFile} />
        </div>
      </div>
    </>
  );
}
