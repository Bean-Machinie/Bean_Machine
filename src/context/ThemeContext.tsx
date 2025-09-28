import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_THEME_ID, ThemeDefinition, THEME_PRESETS } from '../constants/themes';

interface ThemeContextValue {
  theme: ThemeDefinition;
  themeId: string;
  availableThemes: ThemeDefinition[];
  setThemeId: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'tabletop-creator-theme';

const hexToRgbString = (hex: string): string => {
  if (hex.startsWith('rgb')) {
    return hex.replace(/rgb\(|\)/g, '').replace(/\s+/g, ' ').trim();
  }

  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return hex;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
};

const applyTheme = (theme: ThemeDefinition) => {
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.style.colorScheme = theme.colorScheme;

  Object.entries(theme.tokens).forEach(([token, value]) => {
    root.style.setProperty(token, hexToRgbString(value));
  });
};

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_THEME_ID;
    }

    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME_ID;
  });

  const activeTheme = useMemo(() => {
    return (
      THEME_PRESETS.find((candidate) => candidate.id === themeId) ||
      THEME_PRESETS.find((candidate) => candidate.id === DEFAULT_THEME_ID) ||
      THEME_PRESETS[0]
    );
  }, [themeId]);

  useEffect(() => {
    applyTheme(activeTheme);
    localStorage.setItem(STORAGE_KEY, activeTheme.id);
  }, [activeTheme]);

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme: activeTheme,
      themeId: activeTheme.id,
      availableThemes: THEME_PRESETS,
      setThemeId,
    };
  }, [activeTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
