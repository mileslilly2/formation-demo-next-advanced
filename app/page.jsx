'use client';
import { useEffect, useRef, useState } from 'react';

const FORMATIONS_INDEX_URL = '/formations/index.json';

function useKeyControls() {
  const keys = useRef({});
  useEffect(() => {
    const down = (e) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);
  return keys;
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

// cubic bezier interpolator (0..1)
function cubicAt(t, p0, p1, p2, p3){
  const u = 1 - t;
  return (u*u*u)*p0 + 3*(u*u)*t*p1 + 3*u*(t*t)*p2 + (t*t*t)*p3;
}

export default function Page(){
  const canvasRef = useRef(null);
  const [formations, setFormations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [spec, setSpec] = useState(null);
  const keys = useKeyControls();

  useEffect(() => { fetch(FORMATIONS_INDEX_URL).then(r=>r.json()).then(setFormations); }, []);
  useEffect(() => { if(selected) fetch('/formations/'+selected).then(r=>r.json()).then(setSpec); }, [selected]);

  useEffect(() => {
    if(!spec) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w, h;
    function resize(){
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // world state
    const start = performance.now();
    const enemies = [];
    const bullets = [];
    let lastTime = start;
    let spawnIndex = 0;
    const player = { x: w/2, y: h-40, w: 30, h: 14, speed: 240, cooldown: 0 };

    function spawnFromSpec(nowMs){
      const t = nowMs - start;
      const spawns = spec.spawn || [];
      while(spawnIndex < spawns.length && spawns[spawnIndex].t_ms <= t){
        const s = spawns[spawnIndex];
        const type = s.type || 'scout';
        const hp = s.hp ?? 1;
        const size = type==='bruiser' ? 12 : 10;
        const x0 = (s.x_norm ?? 50)/100 * w;
        const y0 = (s.y_norm ?? 0)/100 * h;
        let vx = s.vx_px_s || 0;
        let vy = s.vy_px_s || 60;
        const path = s.path || null; // { type: 'line'|'sine'|'bezier'|'bulletml', ... }
        enemies.push({ x: x0, y: y0, x0, y0, vx, vy, type, hp, size, born: nowMs, path });
        spawnIndex++;
      }
    }

    function updateEnemy(e, dt, now){
      const age = (now - e.born) / 1000;
      if(!e.path || e.path.type==='line'){
        e.x += (e.vx || 0) * dt;
        e.y += (e.vy || 70) * dt;
        return;
      }
      if(e.path.type==='sine'){
        const A = (e.path.amplitude_norm ?? 10) / 100 * (e.path.axis==='y' ? h : w);
        const f = e.path.frequency_hz ?? 0.5;
        const ph = e.path.phase ?? 0;
        const axis = e.path.axis || 'x'; // x oscillation by default
        if(axis==='x'){
          e.x = e.x0 + A * Math.sin(2*Math.PI*f*age + ph);
          e.y += (e.vy || 70) * dt;
        } else {
          e.y = e.y0 + A * Math.sin(2*Math.PI*f*age + ph);
          e.x += (e.vx || 0) * dt;
        }
        return;
      }
      if(e.path.type==='bezier'){
        const dur = (e.path.duration_ms ?? 4000) / 1000;
        const t = Math.min(1, age / Math.max(0.0001, dur));
        const P = e.path.points_norm || [{x:e.x0/w*100,y:e.y0/h*100},{x:50,y:10},{x:60,y:30},{x:50,y:60}];
        const [p0,p1,p2,p3] = P.length>=4 ? P.slice(0,4) : [P[0], P[0], P[0], P[0]];
        const x = cubicAt(t, p0.x/100*w, p1.x/100*w, p2.x/100*w, p3.x/100*w);
        const y = cubicAt(t, p0.y/100*h, p1.y/100*h, p2.y/100*h, p3.y/100*h);
        e.x = x; e.y = y;
        return;
      }
      if(e.path.type==='bulletml'){
        // Map angle+speed to velocity; defaults if missing.
        const ang = (e.path.angle_deg ?? 90) * Math.PI/180;
        const speed = e.path.speed_px_s ?? 100;
        e.x += Math.cos(ang) * speed * dt;
        e.y += Math.sin(ang) * speed * dt;
        return;
      }
    }

    function loop(now){
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      spawnFromSpec(now);

      // input
      const left = keys.current['arrowleft'] || keys.current['a'];
      const right = keys.current['arrowright'] || keys.current['d'];
      const fire = keys.current[' '] || keys.current['space'] || keys.current['arrowup'] || keys.current['w'];
      const move = (right?1:0) - (left?1:0);
      player.x = clamp(player.x + move * player.speed * dt, 16, w-16);
      player.cooldown = Math.max(0, player.cooldown - dt);
      if (fire && player.cooldown === 0){
        bullets.push({ x: player.x, y: player.y-10, vy: -360, size: 3 });
        player.cooldown = 0.15;
      }

      // update enemies
      for(const e of enemies){ updateEnemy(e, dt, now); }

      // update bullets
      for(const b of bullets){ b.y += b.vy * dt; }

      // collisions
      for(const e of enemies){
        for(const b of bullets){
          if(!e.hp) continue;
          const dx = e.x - b.x, dy = e.y - b.y;
          const r = e.size + b.size;
          if(dx*dx + dy*dy < r*r){
            e.hp -= 1; b.dead = True;
          }
        }
      }

      // cull
      for(let i=enemies.length-1;i>=0;i--){
        const e = enemies[i];
        if(e.hp <= 0 || e.y > h+20 || e.x<-40 || e.x> w+40) enemies.splice(i,1);
      }
      for(let i=bullets.length-1;i>=0;i--){
        const b = bullets[i];
        if(b.dead || b.y < -20) bullets.splice(i,1);
      }

      // draw
      ctx.fillStyle = '#0b0f1a';
      ctx.fillRect(0,0,w,h);

      // stars
      ctx.fillStyle = '#223';
      for(let i=0;i<60;i++){
        const sx = (i*97 % w);
        const sy = ((i*53 + (now)*0.05) % h);
        ctx.fillRect(sx, sy, 2,2);
      }

      // player
      ctx.fillStyle = '#6cf';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y-player.h/2);
      ctx.lineTo(player.x-player.w/2, player.y+player.h/2);
      ctx.lineTo(player.x+player.w/2, player.y+player.h/2);
      ctx.closePath();
      ctx.fill();

      // enemies
      for(const e of enemies){
        ctx.fillStyle = e.type==='bruiser' ? '#f96' : (e.type==='ace' ? '#9f6' : '#f66');
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI*2);
        ctx.fill();
        if(e.path && e.path.type==='bezier'){
          // draw bezier guide (optional, faint)
          const P = e.path.points_norm;
          if(P && P.length>=4){
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = '#66f';
            ctx.beginPath();
            ctx.moveTo(P[0].x/100*w, P[0].y/100*h);
            ctx.bezierCurveTo(P[1].x/100*w,P[1].y/100*h,P[2].x/100*w,P[2].y/100*h,P[3].x/100*w,P[3].y/100*h);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      // bullets
      ctx.fillStyle = '#fff';
      for(const b of bullets){ ctx.fillRect(b.x-1, b.y-4, 2, 8); }

      requestAnimationFrame(loop);
    }
    requestAnimationFrame((t)=>{ lastTime=t; loop(t); });

    return () => window.removeEventListener('resize', resize);
  }, [spec]);

  return (
    <main style={{display:'grid', gridTemplateRows:'auto 1fr', height:'100vh'}}>
      <header style={{display:'flex', gap:12, alignItems:'center', padding:'12px 16px', background:'#0e1422', borderBottom:'1px solid #1c2340'}}>
        <h1 style={{fontSize:16, margin:0}}>Formation Demo Pro</h1>
        <span style={{opacity:0.7}}>← → move • Space shoot • Pick a formation</span>
        <div style={{marginLeft:'auto'}}>
          <select value={selected||''} onChange={(e)=>setSelected(e.target.value)} style={{padding:'6px 8px', background:'#10182b', color:'#eaeaea', borderRadius:6}}>
            <option value="" disabled>Choose formation...</option>
            {formations.map((f)=>(<option key={f} value={f}>{f}</option>))}
          </select>
        </div>
      </header>
      <section style={{display:'grid'}}>
        <div style={{placeSelf:'center', width:'min(100%, 1000px)', aspectRatio:'16/9', border:'1px solid #1c2340', borderRadius:12, overflow:'hidden'}}>
          <canvas ref={canvasRef} style={{width:'100%', height:'100%', display:'block'}} />
        </div>
      </section>
    </main>
  );
}
