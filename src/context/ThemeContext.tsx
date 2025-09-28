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

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const parseRgbFunction = (input: string): [number, number, number] | null => {
  const match = input.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }

  const parts = match[1]
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3) {
    return null;
  }

  const values = parts.slice(0, 3).map((value) => {
    if (value.endsWith('%')) {
      const percentage = Number.parseFloat(value.slice(0, -1));
      if (Number.isNaN(percentage)) {
        return null;
      }
      return clamp(Math.round((percentage / 100) * 255), 0, 255);
    }

    const numeric = Number.parseFloat(value);
    return Number.isNaN(numeric) ? null : clamp(Math.round(numeric), 0, 255);
  });

  if (values.some((value) => value === null)) {
    return null;
  }

  return values as [number, number, number];
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s / 100, 0, 1);
  const lightness = clamp(l / 100, 0, 1);

  if (saturation === 0) {
    const gray = Math.round(lightness * 255);
    return [gray, gray, gray];
  }

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  const hueToRgb = (t: number) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  const r = Math.round(hueToRgb(hue / 360 + 1 / 3) * 255);
  const g = Math.round(hueToRgb(hue / 360) * 255);
  const b = Math.round(hueToRgb(hue / 360 - 1 / 3) * 255);

  return [r, g, b];
};

const parseHslFunction = (input: string): [number, number, number] | null => {
  const match = input.match(/hsla?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }

  const parts = match[1]
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3) {
    return null;
  }

  const [hueRaw, saturationRaw, lightnessRaw] = parts;
  const hue = Number.parseFloat(hueRaw);
  const saturation = Number.parseFloat(saturationRaw.replace('%', ''));
  const lightness = Number.parseFloat(lightnessRaw.replace('%', ''));

  if ([hue, saturation, lightness].some((value) => Number.isNaN(value))) {
    return null;
  }

  return hslToRgb(hue, saturation, lightness);
};

const normalizeHex = (input: string): string | null => {
  const value = input.replace('#', '').trim();

  if (value.length === 3 || value.length === 4) {
    return value
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (value.length === 6 || value.length === 8) {
    return value;
  }

  return null;
};

const hexToRgbString = (input: string): string => {
  const value = input.trim();

  if (!value) {
    return value;
  }

  if (/^rgb/i.test(value)) {
    const rgb = parseRgbFunction(value);
    if (rgb) {
      return rgb.join(' ');
    }
  }

  if (/^hsl/i.test(value)) {
    const rgb = parseHslFunction(value);
    if (rgb) {
      return rgb.join(' ');
    }
  }

  if (/^\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?/.test(value)) {
    return value;
  }

  if (value.startsWith('#')) {
    const normalized = normalizeHex(value);
    if (normalized) {
      const r = Number.parseInt(normalized.slice(0, 2), 16);
      const g = Number.parseInt(normalized.slice(2, 4), 16);
      const b = Number.parseInt(normalized.slice(4, 6), 16);
      return `${r} ${g} ${b}`;
    }
  }

  return value;
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
