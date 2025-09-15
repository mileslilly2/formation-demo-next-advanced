'use client';
import React, { useState } from 'react';
import HUD from './HUD';
import PhaserGame from './PhaserGame';

export default function Game() {
  const [selectedFormationFile, setSelectedFormationFile] = useState<string>('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <HUD
        selected={selectedFormationFile}
        onSelect={(f) => setSelectedFormationFile(f)}
      />
      <div style={{ width: '100%', aspectRatio: '16/9', border: '1px solid #223', background: '#061025' }}>
        <PhaserGame selectedFile={selectedFormationFile} />
      </div>
    </div>
  );
}
