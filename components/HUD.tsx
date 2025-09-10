'use client';
import React, { useEffect, useState } from 'react';

export default function HUD({ selected, onSelect }: any) {
  const [list, setList] = useState<string[]>([]);
  useEffect(()=> {
    fetch('/formations/index.json').then(r=>r.ok? r.json():[]).then(a=>setList(Array.isArray(a)?a:[])).catch(()=>setList([]));
  }, []);
  return (
    <header style={{display:'flex',padding:12,background:'#071026'}}>
      <h1 style={{margin:0}}>Demo</h1>
      <div style={{marginLeft:'auto'}}>
        <select value={selected} onChange={e=>onSelect(e.target.value)}>
          <option value=''>choose formation</option>
          {list.map(f=> <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
    </header>
  );
}
