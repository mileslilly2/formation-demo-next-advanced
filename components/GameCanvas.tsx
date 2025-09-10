'use client';
import React, { useEffect, useRef } from 'react';
import useKeyControls from '../hooks/useKeyControls';

export default function GameCanvas({ selectedFile }: any){
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const keys = useKeyControls();
  useEffect(()=> {
    const c = canvasRef.current; if(!c) return;
    const ctx = c.getContext('2d')!;
    function resize(){ c.width = c.clientWidth*devicePixelRatio; c.height = c.clientHeight*devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
    resize(); window.addEventListener('resize', resize);
    let last = performance.now();
    function loop(now:number){
      const dt = (now - last)/1000; last = now;
      ctx.fillStyle = '#061025'; ctx.fillRect(0,0,c.clientWidth, c.clientHeight);
      ctx.fillStyle = '#fff'; ctx.fillText('Game canvas running', 10, 20);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return ()=> window.removeEventListener('resize', resize);
  }, [selectedFile, keys]);
  return <canvas ref={canvasRef} style={{width:'100%',height:'100%'}}/>;
}
