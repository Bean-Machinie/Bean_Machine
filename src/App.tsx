import Home from './pages/Home';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-6 text-center sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
            Tabletop Creator – Your Friendly Game Design Companion
          </h1>
          <nav className="text-sm text-slate-300">
            <span className="rounded-full border border-slate-700 px-3 py-1 font-medium uppercase tracking-wide text-slate-300">
              Starter Layout
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-1 flex-col gap-16 px-6 py-16">
        <Home />
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-6 text-center text-sm text-slate-400 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Tabletop Creator. All rights reserved.</p>
          <p className="text-xs sm:text-sm">Crafted with Vite, React, TypeScript, and Tailwind CSS.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
