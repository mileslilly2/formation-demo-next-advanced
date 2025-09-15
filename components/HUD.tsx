'use client';
import React, { useState } from 'react';

type Props = {
  selected?: string;
  onSelect: (filename: string) => void;
};

// A simple, resilient HUD: quick-select sample formation(s) or paste one manually.
export default function HUD({ selected, onSelect }: Props) {
  const [manual, setManual] = useState('');

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8 }}>
      <div>
        <strong>Formation:</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button onClick={() => onSelect('sine_test.json')}>sine_test.json</button>
          <button onClick={() => onSelect('wave_spiral.json')}>wave_spiral.json</button>
          <button onClick={() => onSelect('classic_wave.json')}>classic_wave.json</button>
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12 }}>Manual filename (in /public/formations)</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="e.g. my_formation.json"
            style={{ padding: 6 }}
          />
          <button onClick={() => { if (manual) onSelect(manual); }}>Load</button>
        </div>
      </div>

      <div style={{ marginLeft: 'auto', fontSize: 13 }}>
        Selected: <span style={{ color: '#8fe' }}>{selected || '—'}</span>
      </div>
    </div>
  );
}
