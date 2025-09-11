'use client';
import React, { useState } from 'react';
import HUD from './HUD';
import GameCanvas from './GameCanvas';

export default function GameScreen() {
  const [selectedFile, setSelectedFile] = useState<string>('');

  return (
    <div style={{display:'grid', gridTemplateRows:'auto 1fr', height:'100vh'}}>
      <HUD selected={selectedFile} onSelect={setSelectedFile} />
      <div style={{display:'grid', placeItems:'center'}}>
        <div style={{
          width:'min(100%, 1100px)',
          aspectRatio:'16/9',
          border:'1px solid #1c2340',
          borderRadius:12,
          overflow:'hidden',
          margin:'24px'
        }}>
          <GameCanvas selectedFile={selectedFile} />
        </div>
      </div>
    </div>
  );
}
