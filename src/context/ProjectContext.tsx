import React, { createContext, useContext, useMemo, useState } from 'react';

export type ProjectItemType = 'board' | 'cardDeck' | 'questPoster' | 'custom';

export interface ProjectItem {
  id: string;
  name: string;
  type: ProjectItemType;
  variant: string;
  customDetails?: string;
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
  createProject: (input: NewProjectInput) => Project;
  updateProjectName: (projectId: string, name: string) => void;
  addItemToProject: (projectId: string, item: ItemInput) => ProjectItem | null;
  addAssetsToProject: (projectId: string, assets: AssetInput[]) => ProjectAsset[];
  removeAssetsFromProject: (projectId: string, assetIds: string[]) => void;
  toggleFavorite: (projectId: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

const createId = () => crypto.randomUUID();

const createTimestamp = (offsetMs: number) => new Date(Date.now() - offsetMs).toISOString();

const initialProjects: Project[] = [
  {
    id: createId(),
    name: 'Mystic Realms Board Game',
    items: [
      {
        id: createId(),
        name: 'Realm Exploration Board',
        type: 'board',
        variant: 'Large (36 × 36 in)',
      },
      {
        id: createId(),
        name: 'Quest Reference Cards',
        type: 'cardDeck',
        variant: 'Tarot (2.75 × 4.75 in)',
      },
    ],
    assets: [
      {
        id: createId(),
        name: 'Forest Illustration',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=60',
      },
      {
        id: createId(),
        name: 'Quest Icon Set',
        url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=60',
      },
    ],
    updatedAt: createTimestamp(1000 * 60 * 60 * 5),
    favorite: false,
  },
  {
    id: createId(),
    name: 'Galactic Outpost Adventure',
    items: [
      {
        id: createId(),
        name: 'Mission Brief Posters',
        type: 'questPoster',
        variant: 'A3 (297 × 420 mm)',
      },
    ],
    assets: [
      {
        id: createId(),
        name: 'Star Map Texture',
        url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=60',
      },
    ],
    updatedAt: createTimestamp(1000 * 60 * 60 * 24 * 3),
    favorite: false,
  },
];

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const withUpdatedTimestamp = (project: Project): Project => ({
    ...project,
    updatedAt: new Date().toISOString(),
  });

  const createProject = (input: NewProjectInput) => {
    const projectId = createId();
    const items: ProjectItem[] = input.initialItem
      ? [
          {
            id: createId(),
            name: input.initialItem.name,
            type: input.initialItem.type,
            variant: input.initialItem.variant,
            customDetails: input.initialItem.customDetails,
          },
        ]
      : [];

    const newProject: Project = {
      id: projectId,
      name: input.name,
      items,
      assets: [],
      updatedAt: new Date().toISOString(),
      favorite: false,
    };

    setProjects((prev) => [...prev, newProject]);
    return newProject;
  };

  const updateProjectName = (projectId: string, name: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? withUpdatedTimestamp({
              ...project,
              name,
            })
          : project,
      ),
    );
  };

  const addItemToProject = (projectId: string, item: ItemInput) => {
    const newItem: ProjectItem = {
      id: createId(),
      name: item.name,
      type: item.type,
      variant: item.variant,
      customDetails: item.customDetails,
    };

    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? withUpdatedTimestamp({
              ...project,
              items: [...project.items, newItem],
            })
          : project,
      ),
    );

    return newItem;
  };

  const addAssetsToProject = (projectId: string, assets: AssetInput[]) => {
    const mappedAssets: ProjectAsset[] = assets.map((asset) => ({
      id: createId(),
      name: asset.name,
      url: asset.url,
    }));

    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? withUpdatedTimestamp({
              ...project,
              assets: [...project.assets, ...mappedAssets],
            })
          : project,
      ),
    );

    return mappedAssets;
  };

  const removeAssetsFromProject = (projectId: string, assetIds: string[]) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? withUpdatedTimestamp({
              ...project,
              assets: project.assets.filter((asset) => !assetIds.includes(asset.id)),
            })
          : project,
      ),
    );
  };

  const toggleFavorite = (projectId: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              favorite: !project.favorite,
            }
          : project,
      ),
    );
  };

  const value = useMemo(
    () => ({
      projects,
      createProject,
      updateProjectName,
      addItemToProject,
      addAssetsToProject,
      removeAssetsFromProject,
      toggleFavorite,
    }),
    [projects],
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

