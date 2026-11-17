'use client';
import { useEffect, useState } from 'react';
import { skipoDarkTheme } from './themes.js';

export function useMonaco() {
  const [monaco, setMonaco] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Lazy load monaco (optional peer dependency)
    const monacoPkg = 'monaco-editor';
    import(/* @vite-ignore */ monacoPkg).then(monacoModule => {
      if (!isMounted) return;
      
      // Register custom theme
      monacoModule.editor.defineTheme('skipo-dark', skipoDarkTheme as any);
      
      setMonaco(monacoModule);
    }).catch(err => {
      console.warn('Failed to load monaco-editor', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return monaco;
}
