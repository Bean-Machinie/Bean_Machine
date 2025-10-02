import { ThemeDefinition } from '../../constants/themes';

interface ThemePreferencesSectionProps {
  availableThemes: ThemeDefinition[];
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
  className?: string;
}

export default function ThemePreferencesSection({
  availableThemes,
  activeThemeId,
  onSelectTheme,
  className,
}: ThemePreferencesSectionProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className ?? ''}`.trim()}>
      {availableThemes.map((theme) => {
        const isActive = activeThemeId === theme.id;
        const backgroundGradient = `linear-gradient(135deg, ${theme.tokens['--color-background']}, ${
          theme.tokens['--color-surface-elevated'] ?? theme.tokens['--color-surface']
        })`;

        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onSelectTheme(theme.id)}
            className={`flex flex-col overflow-hidden rounded-2xl border text-left transition ${
              isActive ? 'border-accent ring-2 ring-accent/40' : 'border-border hover:border-accent/60'
            }`}
            aria-pressed={isActive}
          >
            <div className="relative h-28 w-full" style={{ background: backgroundGradient }}>
              <div
                className="absolute left-4 top-4 h-12 w-12 rounded-full shadow-lg"
                style={{ backgroundColor: theme.tokens['--color-accent'] }}
              />
              <div className="absolute bottom-4 right-4 h-3/4 w-1/3 rounded-lg border border-white/30 bg-white/20 backdrop-blur" />
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-base font-semibold text-text-primary">{theme.label}</p>
                <p className="text-xs uppercase tracking-wide text-text-secondary">
                  {theme.colorScheme === 'dark' ? 'Dark theme' : 'Light theme'}
                </p>
              </div>
              {isActive && (
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                  Active
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
