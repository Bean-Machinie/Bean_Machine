export type ThemeColorScheme = 'light' | 'dark';

export interface ThemeDefinition {
  id: string;
  label: string;
  colorScheme: ThemeColorScheme;
  tokens: Record<string, string>;
}

export const THEME_PRESETS: ThemeDefinition[] = [
  // --- ChatGPT-like (Light) ---
  {
    id: 'chatgpt-light',
    label: 'ChatGPT Light',
    colorScheme: 'light',
    tokens: {
                                                // Backgrounds and surfaces
      '--color-background': '#F8FAB4',        // --color-background – The main page color. Sets the overall vibe.
      '--color-surface': '#FFC7A7',           // --color-surface – The default card/panel color. Most boxes use this.
      '--color-surface-muted': '#f0f2f5',     // -color-surface-muted – A softer card color for secondary areas.
      '--color-surface-elevated': '#ffffff',  // --color-surface-elevated – A stronger card color for top-level areas.
      '--color-overlay': '#0b0f14',           // --color-overlay – The overlay color for modals, popups, and menus.
      '--color-highlight': '#d1fae5',         // --color-highlight – The highlight color for selected text.
                                                
                                                // Borders and outlines
      '--color-border': '#e5e7eb',            // --color-border – The default border color. Used for dividers and outlines.
      '--color-border-strong': '#cbd5e1',     // --color-border-strong – A stronger border color for emphasis.
      '--color-ring': '#F08787',              // --color-ring – The focus ring color for accessibility.

                                                // Typography (Text colors)
      '--color-text-primary': '#111418',      // --color-text-primary – Main text color. Make this the most readable.
      '--color-text-secondary': '#3a3f45',    // --color-text-secondary – Subheadings and supporting text.
      '--color-text-muted': '#6b7280',        // --color-text-muted – Low-importance notes and hints.
      '--color-text-inverse': '#ffffff',      // --color-text-inverse – Text on dark or saturated backgrounds.

                                                // Accent colors (Buttons, links, highlights)
      '--color-accent': '#F08787',            // --color-accent – Primary action color. Use for buttons, links, and highlights.
      '--color-accent-strong': '#FFC7A7',     // --color-accent-strong – A stronger accent color for hover states and emphasis.
      '--color-accent-contrast': '#111418',   // --color-accent-contrast – Text color on top of accent backgrounds.
    },
  },

  // --- ChatGPT-like (Dark) ---
  {
    id: 'chatgpt-dark',
    label: 'ChatGPT Dark',
    colorScheme: 'dark',
    tokens: {
      '--color-background': '#0b1412ff',       // deep neutral
      '--color-surface': '#253835ff',          // panels
      '--color-surface-muted': '#181b20',
      '--color-surface-elevated': '#1f232a',
      '--color-border': '#2b3038',
      '--color-border-strong': '#3a404a',
      '--color-text-primary': '#ececf1',
      '--color-text-secondary': '#cfd2d6',
      '--color-text-muted': '#9aa0a6',
      '--color-text-inverse': '#0b0f14',
      '--color-accent': '#10a37f',
      '--color-accent-strong': '#17b394',
      '--color-accent-contrast': '#062e24',
      '--color-overlay': '#000000',
      '--color-ring': '#10a37f',
      '--color-highlight': '#22c7a8',
    },
  },

  // --- Keep: original Velvet Night ---
  {
    id: 'velvet-night',
    label: 'Velvet Night',
    colorScheme: 'dark',
    tokens: {
      '--color-background': '#1b1035',
      '--color-surface': '#3a2655ff',
      '--color-surface-muted': '#2c2244ff',
      '--color-surface-elevated': '#342057ff',
      '--color-border': '#2c2244ff',
      '--color-border-strong': '#2c2244ff',
      '--color-text-primary': '#ffffff',
      '--color-text-secondary': '#e0def4',
      '--color-text-muted': '#c1badb',
      '--color-text-inverse': '#2a1b3d',
      '--color-accent': '#ffffffff',
      '--color-accent-strong': '#e98074',
      '--color-accent-contrast': '#2a1b3d',
      '--color-overlay': '#100828',
      '--color-ring': '#ffffffff',
      '--color-highlight': '#e98074',
    },
  },

  // --- Keep: Aurora Green ---
  {
    id: 'aurora',
    label: 'Aurora Green',
    colorScheme: 'dark',
    tokens: {
      '--color-background': '#041418',
      '--color-surface': '#062026',
      '--color-surface-muted': '#072c35',
      '--color-surface-elevated': '#0c3a44',
      '--color-border': '#0f4a55',
      '--color-border-strong': '#145d6a',
      '--color-text-primary': '#f1fff7',
      '--color-text-secondary': '#cfeee1',
      '--color-text-muted': '#9bcbb7',
      '--color-text-inverse': '#032021',
      '--color-accent': '#4fd1c5',
      '--color-accent-strong': '#5eead4',
      '--color-accent-contrast': '#022c22',
      '--color-overlay': '#011014',
      '--color-ring': '#5eead4',
      '--color-highlight': '#8be9dd',
    },
  },

  // --- Aurora Light ---
  {
    id: 'Aurora Light',
    label: 'Aurora Light',
    colorScheme: 'light',
    tokens: {
      '--color-background': '#EEF2F6',
      '--color-surface': '#F6F8FB',
      '--color-surface-muted': '#E9EEF5',
      '--color-surface-elevated': '#FFFFFF',
      '--color-border': '#E2E8F0',
      '--color-border-strong': '#CBD5E1',
      '--color-text-primary': '#0F172A',
      '--color-text-secondary': '#334155',
      '--color-text-muted': '#64748B',
      '--color-text-inverse': '#FFFFFF',
      '--color-accent': '#16A34A',
      '--color-accent-strong': '#22C55E',
      '--color-accent-contrast': '#FFFFFF',
      '--color-overlay': '#0B0F14',
      '--color-ring': '#22C55E',
      '--color-highlight': '#E7F5EC',
    },
  },

  // --- Velvet Night ---
  {
    id: 'Velvet Light',
    label: 'Velvet Light',
    colorScheme: 'light',
    tokens: {
      '--color-background': '#0B1120',
      '--color-surface': '#0F172A',
      '--color-surface-muted': '#111C2E',
      '--color-surface-elevated': '#1F2937',
      '--color-border': '#1F2937',
      '--color-border-strong': '#334155',
      '--color-text-primary': '#F8FAFC',
      '--color-text-secondary': '#E2E8F0',
      '--color-text-muted': '#94A3B8',
      '--color-text-inverse': '#0B1120',
      '--color-accent': '#22C55E',
      '--color-accent-strong': '#16A34A',
      '--color-accent-contrast': '#FFFFFF',
      '--color-overlay': '#0B0F14',
      '--color-ring': '#22C55E',
      '--color-highlight': '#0E2A22',
    },
  },
];



export const DEFAULT_THEME_ID = THEME_PRESETS[0].id;
