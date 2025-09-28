import { Route, Routes } from 'react-router-dom';

import ThemeSwitcher from './components/ThemeSwitcher';
import Home from './pages/Home';
import ProjectPage from './pages/ProjectPage';

function App() {
  return (
    <div className="min-h-screen bg-background font-sans text-text-primary">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-center sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Tabletop Creator – Your Friendly Game Design Companion
          </h1>
          <nav className="flex flex-col items-center justify-end gap-2 text-sm text-text-secondary sm:flex-row">
            <span className="rounded-full border border-border/70 px-3 py-1 font-medium uppercase tracking-wide text-text-secondary">
              Starter Layout
            </span>
            <ThemeSwitcher />
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-12 sm:py-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects/:projectId" element={<ProjectPage />} />
        </Routes>
      </main>

      <footer className="border-t border-border bg-surface/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-6 text-center text-sm text-text-muted sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Tabletop Creator. All rights reserved.</p>
          <p className="text-xs sm:text-sm">Crafted with Vite, React, TypeScript, and Tailwind CSS.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
