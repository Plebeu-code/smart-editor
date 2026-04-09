import fs from 'fs';
import path from 'path';
import { Project } from '@/types';

const projectsMap = new Map<string, Project>();
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function getProjectDir(id: string) {
  return path.join(UPLOADS_DIR, id);
}

function getProjectFile(id: string) {
  return path.join(getProjectDir(id), 'project.json');
}

export function saveProject(project: Project): void {
  projectsMap.set(project.id, project);
  const dir = getProjectDir(project.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getProjectFile(project.id), JSON.stringify(project, null, 2));
}

export function getProject(id: string): Project | null {
  if (projectsMap.has(id)) return projectsMap.get(id)!;
  const file = getProjectFile(id);
  if (fs.existsSync(file)) {
    const project = JSON.parse(fs.readFileSync(file, 'utf-8')) as Project;
    projectsMap.set(id, project);
    return project;
  }
  return null;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const project = getProject(id);
  if (!project) return null;
  const updated = { ...project, ...updates, updatedAt: new Date().toISOString() };
  saveProject(updated);
  return updated;
}

export function getUploadPath(projectId: string, filename: string): string {
  const dir = getProjectDir(projectId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, filename);
}
