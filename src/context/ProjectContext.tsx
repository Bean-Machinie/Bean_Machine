import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiFetch } from '../lib/api';
import { useAuth } from './AuthContext';

export type ProjectItemType = 'board' | 'cardDeck' | 'questPoster' | 'custom';

export interface ProjectItemFrame {
  id: string;
  position: number;
  width: number;
  height: number;
  createdAt: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  type: ProjectItemType;
  variant: string;
  customDetails?: string;
  frames: ProjectItemFrame[];
}

export interface ProjectAsset {
  id: string;
  name: string;
  url: string;
}

export interface Project {
  id: string;
  name: string;
  items: ProjectItem[];
  assets: ProjectAsset[];
  updatedAt: string;
  favorite: boolean;
}

export interface ItemInput {
  name: string;
  type: ProjectItemType;
  variant: string;
  customDetails?: string;
}

export interface NewProjectInput {
  name: string;
  initialItem?: ItemInput;
}

export interface AssetInput {
  name: string;
  url: string;
}

interface ProjectContextValue {
  projects: Project[];
  loading: boolean;
  refreshProjects: () => Promise<void>;
  createProject: (input: NewProjectInput) => Promise<Project>;
  updateProjectName: (projectId: string, name: string) => Promise<void>;
  addItemToProject: (projectId: string, item: ItemInput) => Promise<ProjectItem | null>;
  addFrameToItem: (projectId: string, itemId: string) => Promise<ProjectItemFrame | null>;
  addAssetsToProject: (projectId: string, assets: AssetInput[]) => Promise<ProjectAsset[]>;
  removeAssetsFromProject: (projectId: string, assetIds: string[]) => Promise<void>;
  toggleFavorite: (projectId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ projects: Project[] }>('/api/projects', { method: 'GET' });
      setProjects(data.projects);
    } catch (error) {
      console.error('Failed to load projects', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    void fetchProjects();
  }, [fetchProjects, user]);

  const createProject = useCallback(
    async (input: NewProjectInput) => {
      if (!user) {
        throw new Error('You must be signed in to create projects.');
      }

      const data = await apiFetch<{ project: Project }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(input),
      });

      setProjects((prev) => [...prev, data.project]);
      return data.project;
    },
    [user],
  );

  const updateProjectName = useCallback(
    async (projectId: string, name: string) => {
      if (!user) {
        throw new Error('You must be signed in to update projects.');
      }

      const data = await apiFetch<{ project: Project }>(`/api/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });

      setProjects((prev) => prev.map((project) => (project.id === projectId ? data.project : project)));
    },
    [user],
  );

  const addItemToProject = useCallback(
    async (projectId: string, item: ItemInput) => {
      if (!user) {
        throw new Error('You must be signed in to update projects.');
      }

      const data = await apiFetch<{ item: ProjectItem | null; project: Project }>(
        `/api/projects/${projectId}/items`,
        {
          method: 'POST',
          body: JSON.stringify(item),
        },
      );

      setProjects((prev) => prev.map((project) => (project.id === projectId ? data.project : project)));
      return data.item ?? null;
    },
    [user],
  );

  const addFrameToItem = useCallback(
    async (projectId: string, itemId: string) => {
      if (!user) {
        throw new Error('You must be signed in to update projects.');
      }

      const data = await apiFetch<{ frame: ProjectItemFrame | null; project: Project }>(
        `/api/projects/${projectId}/items/${itemId}/frames`,
        {
          method: 'POST',
        },
      );

      setProjects((prev) => prev.map((project) => (project.id === projectId ? data.project : project)));
      return data.frame ?? null;
    },
    [user],
  );

  const addAssetsToProject = useCallback(
    async (projectId: string, assets: AssetInput[]) => {
      if (!user) {
        throw new Error('You must be signed in to update projects.');
      }

      const data = await apiFetch<{ assets: ProjectAsset[]; project: Project }>(
        `/api/projects/${projectId}/assets`,
        {
          method: 'POST',
          body: JSON.stringify({ assets }),
        },
      );

      setProjects((prev) => prev.map((project) => (project.id === projectId ? data.project : project)));
      return data.assets;
    },
    [user],
  );

  const removeAssetsFromProject = useCallback(
    async (projectId: string, assetIds: string[]) => {
      if (!user) {
        throw new Error('You must be signed in to update projects.');
      }

      const data = await apiFetch<{ project: Project }>(`/api/projects/${projectId}/assets`, {
        method: 'DELETE',
        body: JSON.stringify({ assetIds }),
      });

      setProjects((prev) => prev.map((project) => (project.id === projectId ? data.project : project)));
    },
    [user],
  );

  const toggleFavorite = useCallback(
    async (projectId: string) => {
      if (!user) {
        throw new Error('You must be signed in to update projects.');
      }

      const target = projects.find((project) => project.id === projectId);
      if (!target) {
        throw new Error('Project not found.');
      }

      const data = await apiFetch<{ project: Project }>(`/api/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ favorite: !target.favorite }),
      });

      setProjects((prev) => prev.map((project) => (project.id === projectId ? data.project : project)));
    },
    [projects, user],
  );

  const value = useMemo(
    () => ({
      projects,
      loading,
      refreshProjects: fetchProjects,
      createProject,
      updateProjectName,
      addItemToProject,
      addFrameToItem,
      addAssetsToProject,
      removeAssetsFromProject,
      toggleFavorite,
    }),
    [
      addFrameToItem,
      addAssetsToProject,
      addItemToProject,
      createProject,
      fetchProjects,
      loading,
      projects,
      removeAssetsFromProject,
      toggleFavorite,
      updateProjectName,
    ],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }

  return context;
}

export function findProject(projects: Project[], projectId: string) {
  return projects.find((project) => project.id === projectId) ?? null;
}

