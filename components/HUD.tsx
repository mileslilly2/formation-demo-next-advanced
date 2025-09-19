'use client';
import React, { useEffect, useState } from 'react';

type Props = {
  selected: string;
  onSelect: (file: string) => void;
};

export default function HUD({ selected, onSelect }: Props) {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/formations/index.json', { cache: 'no-cache' });
        const data = await res.json();
        if (Array.isArray(data.files)) {
          setFiles(data.files);
        }
      } catch (err) {
        console.error('Failed to load formations index.json', err);
      }
    })();
  }, []);

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <strong>Formation:</strong>
      {files.map((f) => (
        <button
          key={f}
          onClick={() => onSelect(f)}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid #3b4252',
            background: selected === f ? '#3b82f6' : '#111827',
            color: selected === f ? '#fff' : '#cdd6f4',
            cursor: 'pointer'
          }}
        >
          {f}
        </button>
      ))}
      <div style={{ marginLeft: 'auto', opacity: .7 }}>
        Selected: <code>{selected || '—'}</code>
      </div>
    </div>
  );
}
