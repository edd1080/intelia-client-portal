import { readFileSync } from "node:fs";
import path from "node:path";
import { demoPortalData, type ClientPortalData } from "@/lib/airtable";

export type PortalAccessSnapshot = {
  token: string;
  email: string;
  stakeholder?: string;
  projectKey: string;
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

const DATA_DIR = path.join(process.cwd(), "data", "portal");
let accessIndexCache: AccessIndex | null = null;
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

export function resolvePortalAccessSnapshot(accessToken: string) {
  if (!accessToken || accessToken === "demo") return null;
  return getPortalAccessIndex().access.find((entry) => entry.token === accessToken) ?? null;
}

export function resolveProjectByTokenFromSnapshot(accessToken: string): ClientPortalData | null {
  if (accessToken === "demo") return demoPortalData;

  const access = resolvePortalAccessSnapshot(accessToken);
  if (!access) return null;

  if (!projectCache.has(access.projectKey)) {
    const project = readJson<ClientPortalData>(path.join(DATA_DIR, "projects", `${access.projectKey}.json`));
    projectCache.set(access.projectKey, {
      ...project,
      project: {
        ...project.project,
        token: access.token,
      },
    });
  }

  const project = projectCache.get(access.projectKey);
  return project ? { ...project, project: { ...project.project, token: access.token } } : null;
}

export function isEmailAuthorizedForSnapshotAccess(accessToken: string, emailInput: string) {
  const access = resolvePortalAccessSnapshot(accessToken);
  if (!access) return false;
  return access.email.toLowerCase() === emailInput.trim().toLowerCase();
}
