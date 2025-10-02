import { useNavigate } from 'react-router-dom';

function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-12 sm:py-16">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent/70">Help Center</p>
        <h1 className="text-3xl font-semibold text-text-primary sm:text-4xl">Need a hand?</h1>
        <p className="max-w-2xl text-sm text-text-secondary">
          Browse quick tips, learn how to organize your projects, or reach out to our team. We are gathering guides to help
          you ship tabletop experiences faster.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        <article className="rounded-2xl border border-border/80 bg-surface px-5 py-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">Get started</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Explore walkthroughs for creating projects, adding items, and managing your asset library.
          </p>
        </article>
        <article className="rounded-2xl border border-border/80 bg-surface px-5 py-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">Stay updated</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Release notes and upcoming improvements to the Bean Machine toolkit will live here soon.
          </p>
        </article>
      </section>

      <div className="flex flex-col gap-4 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Have a specific question?</h3>
          <p className="text-sm text-text-secondary">Contact support and we will follow up by email.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast transition hover:bg-accent-strong"
        >
          Go to account
        </button>
      </div>
    </div>
  );
}

export default HelpPage;
