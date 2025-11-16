import { useEffect, useState } from 'react';

export type Theme = 'default' | 'colorful' | 'spooky';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('mira-theme');
    return (stored as Theme) || 'default';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-colorful', 'theme-spooky');
    
    // Add new theme class if not default
    if (theme !== 'default') {
      root.classList.add(`theme-${theme}`);
    }
    
    // Save to localStorage
    localStorage.setItem('mira-theme', theme);
  }, [theme]);

  return { theme, setTheme };
};
