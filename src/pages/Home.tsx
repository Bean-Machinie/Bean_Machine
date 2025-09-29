import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ProjectOverviewPanel from '../components/ProjectOverviewPanel';
import NewProjectDialog from '../components/NewProjectDialog';
import { ItemInput } from '../context/ProjectContext';
import { useProjects } from '../context/ProjectContext';

function Home() {
  const navigate = useNavigate();
  const { projects, createProject, toggleFavorite } = useProjects();
  const [isDialogOpen, setDialogOpen] = useState(false);

  const handleCreateProject = useCallback(
    async ({ name, initialItem }: { name: string; initialItem?: ItemInput }) => {
      try {
        const project = await createProject({ name, initialItem });
        setDialogOpen(false);
        navigate(`/projects/${project.id}`);
      } catch (error) {
        console.error('Failed to create project', error);
        throw error;
      }
    },
    [createProject, navigate],
  );

  const handleOpenProject = useCallback(
    (projectId: string) => {
      navigate(`/projects/${projectId}`);
    },
    [navigate],
  );

  const handleToggleFavorite = useCallback(
    async (projectId: string) => {
      try {
        await toggleFavorite(projectId);
      } catch (error) {
        console.error('Failed to toggle favorite', error);
      }
    },
    [toggleFavorite],
  );

  const handleOpenDialog = useCallback(() => setDialogOpen(true), []);
  const handleCloseDialog = useCallback(() => setDialogOpen(false), []);

  const dialogProps = useMemo(
    () => ({
      open: isDialogOpen,
      onClose: handleCloseDialog,
      onCreate: handleCreateProject,
    }),
    [handleCloseDialog, handleCreateProject, isDialogOpen],
  );

  return (
    <>
      <section className="flex flex-col gap-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            Unleash your creativity and bring your tabletop game ideas to life with ease!
          </h2>
        </div>

        <ProjectOverviewPanel
          projects={projects}
          onOpenProject={handleOpenProject}
          onCreateProject={handleOpenDialog}
          onToggleFavorite={handleToggleFavorite}
        />
      </section>

      <NewProjectDialog {...dialogProps} />
    </>
  );
}

export default Home;
