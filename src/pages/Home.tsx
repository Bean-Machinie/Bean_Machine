import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ProjectOverviewPanel from '../components/ProjectOverviewPanel';
import NewProjectDialog from '../components/NewProjectDialog';
import { ItemInput } from '../context/ProjectContext';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';

interface HomeProps {
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
}

function Home({ onOpenSignIn, onOpenSignUp }: HomeProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  if (!user) {
    return (
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-accent/20 via-surface-muted/40 to-transparent" />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-16 text-center">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            Unleash your creativity and bring your tabletop game ideas to life with ease!
          </h2>
          <p className="max-w-2xl text-pretty text-base text-text-secondary sm:text-lg">
            Start building custom boards, cards, and quests for your tabletop adventures with collaborative tools designed for storytellers.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={onOpenSignIn}
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-primary transition hover:border-accent hover:text-accent"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onOpenSignUp}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-text-inverse shadow-sm transition hover:bg-accent/90"
            >
              Create your account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-12 sm:py-16">
      <ProjectOverviewPanel
        projects={projects}
        onOpenProject={handleOpenProject}
        onCreateProject={handleOpenDialog}
        onToggleFavorite={handleToggleFavorite}
      />

      <NewProjectDialog {...dialogProps} />
    </div>
  );
}

export default Home;
