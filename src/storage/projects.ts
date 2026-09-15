/**
 * Local project persistence via localStorage (IndexedDB-ready interface).
 */

export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  lastBeam?: unknown;
  lastMaterials?: unknown;
}

const KEY = 'speccalc.projects.v1';
const ACTIVE_KEY = 'speccalc.activeProject.v1';

function readAll(): ProjectRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProjectRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(projects: ProjectRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(projects));
}

export function listProjects(): ProjectRecord[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProject(id: string): ProjectRecord | undefined {
  return readAll().find((p) => p.id === id);
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProjectId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function createProject(name: string): ProjectRecord {
  const now = new Date().toISOString();
  const project: ProjectRecord = {
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || 'Untitled Project',
    createdAt: now,
    updatedAt: now,
  };
  const all = readAll();
  all.push(project);
  writeAll(all);
  setActiveProjectId(project.id);
  return project;
}

export function updateProject(id: string, patch: Partial<ProjectRecord>): ProjectRecord | undefined {
  const all = readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;
  const updated: ProjectRecord = {
    ...all[idx],
    ...patch,
    id: all[idx].id,
    createdAt: all[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function deleteProject(id: string): void {
  writeAll(readAll().filter((p) => p.id !== id));
  if (getActiveProjectId() === id) setActiveProjectId(null);
}

export function saveBeamResult(projectId: string, data: unknown): void {
  updateProject(projectId, { lastBeam: data });
}

export function saveMaterialsResult(projectId: string, data: unknown): void {
  updateProject(projectId, { lastMaterials: data });
}
