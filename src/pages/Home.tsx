import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ProjectOverviewPanel from '../components/ProjectOverviewPanel';
import NewProjectDialog from '../components/NewProjectDialog';
import { ItemInput } from '../context/ProjectContext';
import { useProjects } from '../context/ProjectContext';

function Home() {
  const navigate = useNavigate();
  const { projects, createProject } = useProjects();
  const [isDialogOpen, setDialogOpen] = useState(false);

  const handleCreateProject = ({ name, initialItem }: { name: string; initialItem?: ItemInput }) => {
    const project = createProject({ name, initialItem });
    setDialogOpen(false);
    navigate(`/projects/${project.id}`);
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <>
      <section className="flex flex-col gap-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <span className="rounded-full border border-slate-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
            Build Your Worlds
          </span>
          <h2 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Unleash your creativity and bring your tabletop game ideas to life with ease!
          </h2>
          <p className="max-w-2xl text-balance text-lg leading-relaxed text-slate-300">
            Tabletop Creator is the all-in-one tool for designing boards, cards, quest posters, and more.
          </p>
        </div>

        <ProjectOverviewPanel
          projects={projects}
          onOpenProject={handleOpenProject}
          onCreateProject={() => setDialogOpen(true)}
        />
      </section>

      <NewProjectDialog open={isDialogOpen} onClose={() => setDialogOpen(false)} onCreate={handleCreateProject} />
    </>
  );
}

export default Home;
