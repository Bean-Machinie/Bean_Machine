type FeatureCardProps = {
  title: string;
  description: string;
};

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <article className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40 transition hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/80">
      <h3 className="text-xl font-semibold text-white transition group-hover:text-emerald-300">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        {description}
      </p>
      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-300">
        <span>Coming soon</span>
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M4.5 3.5a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-3.19l5.72 5.72a.75.75 0 1 1-1.06 1.06L6 5.31v3.19a.75.75 0 0 1-1.5 0z" />
        </svg>
      </div>
    </article>
  );
}

export default FeatureCard;
