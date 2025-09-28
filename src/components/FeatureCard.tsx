type FeatureCardProps = {
  title: string;
  description: string;
};

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <article className="group rounded-2xl border border-border bg-surface-muted/60 p-6 shadow-lg shadow-black/40 transition hover:-translate-y-1 hover:border-border/70 hover:bg-surface-muted/80">
      <h3 className="text-xl font-semibold text-text-primary transition group-hover:text-accent/80">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-accent/70">
        <span>Coming soon</span>
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.5 3.5a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-3.19l5.72 5.72a.75.75 0 1 1-1.06 1.06L6 5.31v3.19a.75.75 0 0 1-1.5 0z" />
        </svg>
      </div>
    </article>
  );
}

export default FeatureCard;
