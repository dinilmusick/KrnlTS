'use client';

import {useEffect,useState} from 'react';
import {BaseButton} from '@ultrst-armada/floks/ui';

type Theme='system'|'light'|'dark';
const STORAGE_KEY='kone.theme';

export default function ThemesTab(){
  const[theme,setTheme]=useState<Theme>(()=>typeof window==='undefined'?'system':(localStorage.getItem(STORAGE_KEY) as Theme)||'system');

  useEffect(()=>{
    const root=document.documentElement;
    root.dataset.theme=theme;
    if(theme==='system') delete root.dataset.theme;
    else root.dataset.theme=theme;
    localStorage.setItem(STORAGE_KEY,theme);
  },[theme]);

  return <section style={{padding:24,maxWidth:640}}>
    <h2>Themes</h2>
    <p>Choose the application appearance.</p>
    <div style={{display:'flex',gap:8}}>
      {(['system','light','dark'] as Theme[]).map(value=>
        <BaseButton key={value} size="sm" variant={theme===value?'accent':'secondary'} onClick={()=>setTheme(value)}>
          {value[0].toUpperCase()+value.slice(1)}
        </BaseButton>
      )}
    </div>
  </section>;
}