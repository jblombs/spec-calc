import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UnitSystem } from '../engine/units';
import {
  createProject,
  deleteProject,
  getActiveProjectId,
  listProjects,
  setActiveProjectId,
  updateProject,
  type ProjectRecord,
} from '../storage/projects';

export type ThemeMode = 'dark' | 'light';

interface AppSettings {
  theme: ThemeMode;
  unitSystem: UnitSystem;
  deflectionLimitDivisor: number;
}

interface AppContextValue {
  settings: AppSettings;
  setTheme: (t: ThemeMode) => void;
  setUnitSystem: (u: UnitSystem) => void;
  setDeflectionLimitDivisor: (n: number) => void;
  projects: ProjectRecord[];
  activeProject: ProjectRecord | null;
  refreshProjects: () => void;
  selectProject: (id: string | null) => void;
  addProject: (name: string) => ProjectRecord;
  renameProject: (id: string, name: string) => void;
  removeProject: (id: string) => void;
  touchProject: (id: string, patch: Partial<ProjectRecord>) => void;
}

const SETTINGS_KEY = 'speccalc.settings.v1';

const defaultSettings: AppSettings = {
  theme: 'dark',
  unitSystem: 'imperial',
  deflectionLimitDivisor: 360,
};

const AppContext = createContext<AppContextValue | null>(null);

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [projects, setProjects] = useState<ProjectRecord[]>(() => listProjects());
  const [activeId, setActiveId] = useState<string | null>(() => getActiveProjectId());

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, []);

  const refreshProjects = useCallback(() => {
    setProjects(listProjects());
  }, []);

  const selectProject = useCallback((id: string | null) => {
    setActiveProjectId(id);
    setActiveId(id);
    refreshProjects();
  }, [refreshProjects]);

  const addProject = useCallback(
    (name: string) => {
      const p = createProject(name);
      refreshProjects();
      setActiveId(p.id);
      return p;
    },
    [refreshProjects],
  );

  const renameProject = useCallback(
    (id: string, name: string) => {
      updateProject(id, { name });
      refreshProjects();
    },
    [refreshProjects],
  );

  const removeProject = useCallback(
    (id: string) => {
      deleteProject(id);
      setActiveId(getActiveProjectId());
      refreshProjects();
    },
    [refreshProjects],
  );

  const touchProject = useCallback(
    (id: string, patch: Partial<ProjectRecord>) => {
      updateProject(id, patch);
      refreshProjects();
    },
    [refreshProjects],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      setTheme: (theme) => setSettings((s) => ({ ...s, theme })),
      setUnitSystem: (unitSystem) => setSettings((s) => ({ ...s, unitSystem })),
      setDeflectionLimitDivisor: (deflectionLimitDivisor) =>
        setSettings((s) => ({ ...s, deflectionLimitDivisor })),
      projects,
      activeProject: projects.find((p) => p.id === activeId) ?? null,
      refreshProjects,
      selectProject,
      addProject,
      renameProject,
      removeProject,
      touchProject,
    }),
    [
      settings,
      projects,
      activeId,
      refreshProjects,
      selectProject,
      addProject,
      renameProject,
      removeProject,
      touchProject,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
