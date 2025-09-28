import { ChangeEvent } from 'react';

import { useTheme } from '../context/ThemeContext';

function ThemeSwitcher() {
  const { themeId, availableThemes, setThemeId } = useTheme();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setThemeId(event.target.value);
  };

  return (
    <label className="flex items-center gap-2 rounded-full border border-border/60 bg-surface-muted/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
      Theme
      <select
        value={themeId}
        onChange={handleChange}
        className="rounded-full border border-border/60 bg-surface/80 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-text-secondary outline-none transition focus:border-accent focus:text-text-primary"
      >
        {availableThemes.map((theme) => (
          <option key={theme.id} value={theme.id} className="text-base text-text-primary">
            {theme.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default ThemeSwitcher;
