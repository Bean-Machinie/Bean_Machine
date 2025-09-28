import FeatureCard from '../components/FeatureCard';

const features = [
  {
    title: 'Create & Save Projects',
    description:
      'Start new tabletop adventures with structured project workspaces you can revisit any time.',
  },
  {
    title: 'Design With Ease',
    description:
      'Use intuitive tools to draft boards, cards, and quest posters without complex setup.',
  },
  {
    title: 'Print or Order',
    description:
      'Export print-ready files or connect with partners when you are ready to share your game.',
  },
];

function Home() {
  return (
    <section className="flex flex-col gap-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="rounded-full border border-slate-700 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-slate-300">
          Build Your Worlds
        </span>
        <h2 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Unleash your creativity and bring your tabletop game ideas to life with ease!
        </h2>
        <p className="max-w-2xl text-balance text-lg leading-relaxed text-slate-300">
          Tabletop Creator is the all-in-one tool for designing boards, cards, quest posters, and more.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature.title} title={feature.title} description={feature.description} />
        ))}
      </div>
    </section>
  );
}

export default Home;
