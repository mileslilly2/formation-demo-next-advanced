'use client';
import React, { useState, useEffect } from 'react';
import GameCanvas from './GameCanvas';


const btnStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(255,255,255,0.2)',
  color: '#fff',
  fontSize: '24px',
  fontWeight: 'bold',
  touchAction: 'none',
  userSelect: 'none',
  transition: 'background 0.1s'
};

export default function GameScreen() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      minWidth: '320px',
      minHeight: '480px',
      border: '1px solid #1c2340',
      borderRadius: 12,
      overflow: 'hidden'
    }}>
      <GameCanvas selectedFile={''} />

      {isTouch && (
        <>
          {/* Left/Right controls */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            display: 'flex',
            gap: '12px',
          }}>
            <button id="btn-left" className="virt-btn" style={btnStyle}>◀</button>
            <button id="btn-right" className="virt-btn" style={btnStyle}>▶</button>
          </div>
          {/* Fire control */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
          }}>
            <button id="btn-fire" className="virt-btn" style={btnStyle}>🔥</button>
          </div>
        </>
      )}

      <style jsx>{`
        .virt-btn:active {
          background: rgba(255,255,255,0.5);
        }
      `}</style>
    </div>
  );
}
