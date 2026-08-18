import { readFileSync } from "node:fs";
import path from "node:path";
import { demoPortalData, type ClientPortalData } from "@/lib/airtable";

export type PortalAccessSnapshot = {
  token: string;
  email: string;
  stakeholder?: string;
  projectKey: string;
  publicSlug?: string;
  projectId: string;
  baseId: string;
  accessRecordId?: string;
  clientName: string;
  projectName: string;
};

type AccessIndex = {
  generatedAt: string;
  access: PortalAccessSnapshot[];
};

type PortalManifest = {
  generatedAt: string;
  projects: Array<{ key: string; publicSlug?: string; projectName: string; clientName: string }>;
};

const DATA_DIR = path.join(process.cwd(), "data", "portal");
let accessIndexCache: AccessIndex | null = null;
let manifestCache: PortalManifest | null = null;
const projectCache = new Map<string, ClientPortalData>();

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function getPortalAccessIndex() {
  if (!accessIndexCache) {
    accessIndexCache = readJson<AccessIndex>(path.join(DATA_DIR, "access-index.json"));
  }
  return accessIndexCache;
}

export function getPortalManifest() {
  if (!manifestCache) {
    manifestCache = readJson<PortalManifest>(path.join(DATA_DIR, "manifest.json"));
  }
  return manifestCache;
}

export function resolvePortalAccessSnapshot(accessToken: string) {
  if (!accessToken || accessToken === "demo") return null;
  return getPortalAccessIndex().access.find((entry) => entry.token === accessToken) ?? null;
}

function readProjectSnapshot(projectKey: string, identifier: string): ClientPortalData | null {
  if (!projectCache.has(projectKey)) {
    const project = readJson<ClientPortalData>(path.join(DATA_DIR, "projects", `${projectKey}.json`));
    projectCache.set(projectKey, project);
  }

  const project = projectCache.get(projectKey);
  return project ? { ...project, project: { ...project.project, token: identifier } } : null;
}

export function resolveProjectByTokenFromSnapshot(accessToken: string): ClientPortalData | null {
  if (accessToken === "demo") return demoPortalData;

  const access = resolvePortalAccessSnapshot(accessToken);
  if (!access) return null;
  return readProjectSnapshot(access.projectKey, access.token);
}

export function resolveProjectByPublicSlugFromSnapshot(publicSlug: string): ClientPortalData | null {
  if (publicSlug === "demo") return demoPortalData;
  if (!publicSlug) return null;

  const project = getPortalManifest().projects.find((entry) => entry.publicSlug === publicSlug);
  if (!project) return null;
  return readProjectSnapshot(project.key, publicSlug);
}

export function resolveProjectByPublicIdentifierFromSnapshot(identifier: string): ClientPortalData | null {
  return resolveProjectByTokenFromSnapshot(identifier) ?? resolveProjectByPublicSlugFromSnapshot(identifier);
}

export function isEmailAuthorizedForSnapshotAccess(accessTokenOrSlug: string, emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  const access = resolvePortalAccessSnapshot(accessTokenOrSlug);
  if (access) return access.email.toLowerCase() === email;

  const project = getPortalManifest().projects.find((entry) => entry.publicSlug === accessTokenOrSlug);
  if (!project) return false;
  return getPortalAccessIndex().access.some((entry) => entry.projectKey === project.key && entry.email.toLowerCase() === email);
}
