import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type AirtableRecord<T = Record<string, unknown>> = {
  id: string;
  createdTime: string;
  fields: T;
};

type AirtableListResponse<T = Record<string, unknown>> = {
  records: AirtableRecord<T>[];
  offset?: string;
};

export type ProjectStatus = "en curso" | "en riesgo" | "atrasado" | "completado" | "pausado" | string;

export type ClientPortalData = {
  client: {
    id: string;
    name: string;
    logoUrl?: string;
    brandColor: string;
    contactName?: string;
    contactEmail?: string;
  };
  project: {
    id: string;
    name: string;
    code: string;
    token: string;
    status: ProjectStatus;
    currentPhase?: string;
    progress?: number;
    startDate?: string;
    targetEndDate?: string;
    executiveSummary: string;
    remainingExplanation?: string;
    clientSignal?: string;
    clientMessage?: string;
    nextMilestone?: string;
    nextMilestoneDate?: string;
    enabledSections: string[];
  };
  tasks: Task[];
  milestones: Milestone[];
  activity: ActivityItem[];
  questions: Question[];
  files: DeliverableFile[];
  impactMetrics: ImpactMetric[];
  lastUpdated: { date?: string; by: string };
  source: { masterRecordId: string; baseId: string };
};

export type Task = { id: string; name: string; status: string; dueDate?: string; milestone?: string; visibleToClient: boolean; isCurrent: boolean; description?: string; priority?: string; needsClientAction?: boolean; requiredAction?: string; ganttStart?: string; ganttEnd?: string; ganttProgress?: number; ganttOrder?: number; ganttDependencies?: string };
export type Milestone = { id: string; name: string; estimatedDate?: string; actualDate?: string; status: string; description?: string; acceptanceCriteria?: string };
export type ActivityItem = { id: string; date?: string; type?: string; title?: string; description: string; clientMeaning?: string; origin?: string; visibleToClient?: boolean };
export type Question = { id: string; author: string; message: string; date?: string; status: string; answer?: string; answeredAt?: string; requiresClientDecision?: boolean };
export type DeliverableFile = { id: string; name: string; url: string; date?: string; category?: string; status?: string; description?: string; visibleToClient?: boolean };
export type ImpactMetric = { label: string; value: string; note?: string };

type MasterClient = { recordId: string; clientName: string; baseId: string; status: string };

const MASTER_BASE_ID = process.env.AIRTABLE_MASTER_BASE_ID ?? "appw3DgL0Piib7MZP";
const MASTER_CLIENTS_TABLE_ID = process.env.AIRTABLE_MASTER_CLIENTS_TABLE_ID ?? "tbl4Pwxo7jNpDxYXf";
const API_ROOT = "https://api.airtable.com/v0";

export const TABLES = {
  clients: "Clientes",
  projects: "Proyectos",
  accessPortal: "Accesos Portal",
  tasks: "Tareas",
  activity: "Actividad",
  questions: "Preguntas",
  milestones: "Hitos",
  files: "Archivos",
} as const;

function token() {
  const value = process.env.AIRTABLE_API_KEY;
  if (!value) throw new Error("Missing AIRTABLE_API_KEY");
  return value;
}

async function airtableFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    next: { revalidate: init.method && init.method !== "GET" ? 0 : 60 },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
}

async function listRecords<T = Record<string, unknown>>(baseId: string, tableId: string, query: Record<string, string | number> = {}) {
  const all: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    Object.entries(query).forEach(([key, value]) => params.set(key, String(value)));
    if (offset) params.set("offset", offset);

    const data = await airtableFetch<AirtableListResponse<T>>(`${API_ROOT}/${baseId}/${encodeURIComponent(tableId)}?${params.toString()}`);
    all.push(...data.records);
    offset = data.offset;
  } while (offset);

  return all;
}

function field<T = unknown>(fields: Record<string, unknown>, names: string[], fallback?: T): T {
  for (const name of names) {
    if (fields[name] !== undefined && fields[name] !== null && fields[name] !== "") return fields[name] as T;
  }
  return fallback as T;
}

function text(fields: Record<string, unknown>, names: string[], fallback = "") {
  const value = field<unknown>(fields, names, fallback);
  if (Array.isArray(value)) return value.map(String).join(", ");
  return String(value ?? fallback);
}

function list(fields: Record<string, unknown>, names: string[]) {
  const value = field<unknown>(fields, names, []);
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function numberValue(fields: Record<string, unknown>, names: string[], fallback = 0) {
  const value = field<unknown>(fields, names, fallback);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function linkedTo(record: AirtableRecord, fieldName: string, linkedRecordId: string) {
  const raw = record.fields[fieldName];
  return Array.isArray(raw) && raw.includes(linkedRecordId);
}

function firstAttachmentUrl(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] && "url" in value[0]) {
    return String((value[0] as { url: string }).url);
  }
  return undefined;
}

function isTaskCurrent(status: string) {
  const normalized = status.toLowerCase();
  return normalized.includes("progreso") || normalized.includes("trabaj") || normalized.includes("doing") || normalized.includes("in progress");
}

function latestActivityUpdate(activity: ActivityItem[], fallbackDate?: string) {
  const dated = activity
    .filter((item) => item.date)
    .sort((a, b) => new Date(`${b.date}T00:00:00`).getTime() - new Date(`${a.date}T00:00:00`).getTime());
  const latest = dated[0];
  return {
    date: latest?.date || fallbackDate,
    by: latest?.origin ? humanizeOrigin(latest.origin) : "Intelia",
  };
}

function humanizeOrigin(origin: string) {
  const normalized = origin.trim().toLowerCase();
  const labels: Record<string, string> = {
    hermes: "Hermes",
    "panel admin": "Panel admin",
    "claude-mcp": "Claude",
    claude: "Claude",
    cliente: "Cliente",
    sesión: "Sesión de trabajo",
    sesion: "Sesión de trabajo",
  };
  return labels[normalized] ?? origin;
}

export async function getMasterClients(): Promise<MasterClient[]> {
  const records = await listRecords(MASTER_BASE_ID, MASTER_CLIENTS_TABLE_ID);
  return records.map((record) => ({
    recordId: record.id,
    clientName: text(record.fields, ["Cliente", "Nombre del cliente", "Nombre"]),
    baseId: text(record.fields, ["Base ID", "BaseId", "Airtable Base ID"]),
    status: text(record.fields, ["Estado"], "Activo"),
  })).filter((client) => client.baseId && client.status.toLowerCase() !== "inactivo");
}

export async function resolveProjectByToken(accessToken: string): Promise<ClientPortalData | null> {
  if (accessToken === "demo") return demoPortalData;

  const snapshotData = resolveProjectByTokenSnapshotFirst(accessToken);
  if (snapshotData) return snapshotData;

  const clients = await getMasterClients();
  for (const masterClient of clients) {
    const escapedToken = accessToken.replaceAll("'", "\\'");
    const accessFormula = `AND({Token}='${escapedToken}', {Estado}='activo')`;

    try {
      const accessRecords = await listRecords(masterClient.baseId, TABLES.accessPortal, { filterByFormula: accessFormula, maxRecords: 1 });
      const projectId = list(accessRecords[0]?.fields ?? {}, ["Proyecto"])[0];
      if (projectId) {
        const project = await airtableFetch<AirtableRecord>(`${API_ROOT}/${masterClient.baseId}/${encodeURIComponent(TABLES.projects)}/${projectId}`);
        return getPortalData(masterClient, project, accessRecords[0]);
      }
    } catch (error) {
      console.warn(`Access table lookup failed for ${masterClient.clientName}; falling back to project token`, error);
    }

    const formula = `{Token de acceso}='${escapedToken}'`;
    const projects = await listRecords(masterClient.baseId, TABLES.projects, { filterByFormula: formula, maxRecords: 1 });
    if (projects.length > 0) return getPortalData(masterClient, projects[0]);
  }

  return null;
}

function resolveProjectByTokenSnapshotFirst(accessToken: string): ClientPortalData | null {
  try {
    const dataDir = path.join(process.cwd(), "data", "portal");
    const accessIndexPath = path.join(dataDir, "access-index.json");
    if (!existsSync(accessIndexPath)) return null;

    const accessIndex = JSON.parse(readFileSync(accessIndexPath, "utf8")) as { access?: Array<{ token: string; projectKey: string }> };
    const access = accessIndex.access?.find((entry) => entry.token === accessToken);
    if (!access?.projectKey) return null;

    const projectPath = path.join(dataDir, "projects", `${access.projectKey}.json`);
    if (!existsSync(projectPath)) return null;

    const project = JSON.parse(readFileSync(projectPath, "utf8")) as ClientPortalData;
    return { ...project, project: { ...project.project, token: accessToken } };
  } catch (error) {
    console.warn("Portal snapshot lookup failed; falling back to Airtable", error);
    return null;
  }
}

async function getPortalData(masterClient: MasterClient, projectRecord: AirtableRecord, accessRecord?: AirtableRecord): Promise<ClientPortalData> {
  const [clientRecords, taskRecords, milestoneRecords, activityRecords, questionRecords, fileRecords] = await Promise.all([
    listRecords(masterClient.baseId, TABLES.clients),
    listRecords(masterClient.baseId, TABLES.tasks),
    listRecords(masterClient.baseId, TABLES.milestones),
    listRecords(masterClient.baseId, TABLES.activity),
    listRecords(masterClient.baseId, TABLES.questions),
    listRecords(masterClient.baseId, TABLES.files),
  ]);

  const linkedClientId = list(projectRecord.fields, ["Cliente"])[0];
  const clientRecord = clientRecords.find((record) => record.id === linkedClientId) ?? clientRecords[0];
  const projectId = projectRecord.id;

  const milestonesById = new Map(milestoneRecords.map((record) => [record.id, text(record.fields, ["Nombre", "Hito"])]));
  const tasks = taskRecords
    .filter((record) => linkedTo(record, "Proyecto", projectId))
    .map((record) => {
      const status = text(record.fields, ["Estado"], "por hacer");
      return {
        id: record.id,
        name: text(record.fields, ["Nombre", "Tarea"]),
        status,
        dueDate: text(record.fields, ["Fecha estimada", "Fecha"], ""),
        milestone: milestonesById.get(list(record.fields, ["Hito relacionado"])[0] ?? ""),
        visibleToClient: field<boolean>(record.fields, ["Visible al cliente"], false),
        isCurrent: field<boolean>(record.fields, ["Es actual"], isTaskCurrent(status)),
        description: text(record.fields, ["Descripción cliente", "Descripcion cliente", "Descripción", "Notas internas"], ""),
        priority: text(record.fields, ["Prioridad"], ""),
        needsClientAction: field<boolean>(record.fields, ["Necesita acción del cliente"], false),
        requiredAction: text(record.fields, ["Acción requerida", "Accion requerida"], ""),
        ganttStart: text(record.fields, ["Fecha inicio Gantt", "Fecha de inicio", "Fecha"], ""),
        ganttEnd: text(record.fields, ["Fecha fin Gantt", "Fecha estimada", "Fecha"], ""),
        ganttProgress: numberValue(record.fields, ["Progreso Gantt %"], status.toLowerCase().includes("complet") ? 100 : isTaskCurrent(status) ? 50 : 0),
        ganttOrder: numberValue(record.fields, ["Orden Gantt"], 999),
        ganttDependencies: text(record.fields, ["Dependencias Gantt"], ""),
      };
    });
  const activity = activityRecords
    .filter((record) => linkedTo(record, "Proyecto", projectId))
    .map((record) => ({
      id: record.id,
      date: text(record.fields, ["Fecha"], ""),
      type: text(record.fields, ["Tipo"], "nota"),
      title: text(record.fields, ["Título", "Titulo", "Nombre"], ""),
      description: text(record.fields, ["Descripción", "Descripcion", "Descripción en lenguaje plano"], ""),
      clientMeaning: text(record.fields, ["Qué significa para el cliente", "Que significa para el cliente"], ""),
      origin: text(record.fields, ["Origen"], ""),
      visibleToClient: field<boolean>(record.fields, ["Visible al cliente"], true),
    }))
    .sort((a, b) => new Date(`${b.date}T00:00:00`).getTime() - new Date(`${a.date}T00:00:00`).getTime());

  return {
    client: {
      id: clientRecord?.id ?? masterClient.recordId,
      name: clientRecord ? text(clientRecord.fields, ["Nombre", "Cliente"], masterClient.clientName) : masterClient.clientName,
      logoUrl: clientRecord ? firstAttachmentUrl(field(clientRecord.fields, ["Logo", "logo"])) : undefined,
      brandColor: clientRecord ? text(clientRecord.fields, ["Color de marca", "Color", "Brand color"], "#18213D") : "#18213D",
      contactName: clientRecord ? text(clientRecord.fields, ["Contacto principal", "Contacto", "Nombre contacto"], "") : "",
      contactEmail: clientRecord ? text(clientRecord.fields, ["Email contacto", "Correo", "Email"], "") : "",
    },
    project: {
      id: projectId,
      name: text(projectRecord.fields, ["Nombre", "Proyecto"]),
      code: text(projectRecord.fields, ["Código", "Codigo", "Código corto", "Codigo corto", "Código del proyecto"]),
      token: text(accessRecord?.fields ?? projectRecord.fields, ["Token", "Token de acceso"]),
      status: text(projectRecord.fields, ["Estado general", "Estado"], "en curso"),
      currentPhase: text(projectRecord.fields, ["Fase actual"], ""),
      progress: numberValue(projectRecord.fields, ["Progreso %", "Progreso", "Avance %"], 0),
      startDate: text(projectRecord.fields, ["Fecha de inicio"], ""),
      targetEndDate: text(projectRecord.fields, ["Fecha estimada de cierre", "Fecha cierre estimada"], ""),
      executiveSummary: text(projectRecord.fields, ["Resumen ejecutivo"], "El proyecto avanza conforme al plan y el siguiente paso ya está identificado."),
      remainingExplanation: text(projectRecord.fields, ["Explicación del avance restante", "Explicacion del avance restante"], ""),
      clientSignal: text(projectRecord.fields, ["Semáforo cliente", "Semaforo cliente"], ""),
      clientMessage: text(projectRecord.fields, ["Mensaje para cliente"], ""),
      nextMilestone: text(projectRecord.fields, ["Próximo hito", "Proximo hito"], ""),
      nextMilestoneDate: text(projectRecord.fields, ["Fecha próximo hito", "Fecha proximo hito", "Fecha del próximo hito"], ""),
      enabledSections: list(projectRecord.fields, ["Secciones habilitadas"]),
    },
    tasks,
    milestones: milestoneRecords
      .filter((record) => linkedTo(record, "Proyecto", projectId))
      .map((record) => ({
        id: record.id,
        name: text(record.fields, ["Nombre", "Hito"]),
        estimatedDate: text(record.fields, ["Fecha estimada"], ""),
        actualDate: text(record.fields, ["Fecha real"], ""),
        status: text(record.fields, ["Estado"], "pendiente"),
        description: text(record.fields, ["Descripción cliente", "Descripcion cliente", "Descripción"], ""),
        acceptanceCriteria: text(record.fields, ["Criterio de aceptación", "Criterio de aceptacion"], ""),
      })),
    activity,
    questions: questionRecords
      .filter((record) => linkedTo(record, "Proyecto", projectId))
      .map((record) => ({
        id: record.id,
        author: text(record.fields, ["Autor"], "cliente"),
        message: text(record.fields, ["Mensaje", "Pregunta"], ""),
        date: text(record.fields, ["Fecha"], ""),
        status: text(record.fields, ["Estado"], "sin responder"),
        answer: text(record.fields, ["Respuesta"], ""),
        answeredAt: text(record.fields, ["Fecha de respuesta"], ""),
        requiresClientDecision: field<boolean>(record.fields, ["Requiere decisión de cliente"], false),
      })),
    files: fileRecords
      .filter((record) => linkedTo(record, "Proyecto", projectId))
      .map((record) => ({
        id: record.id,
        name: text(record.fields, ["Nombre", "Archivo"]),
        url: text(record.fields, ["URL", "Url", "Link", "url"]),
        date: text(record.fields, ["Fecha"], ""),
        category: text(record.fields, ["Categoría", "Categoria"], ""),
        status: text(record.fields, ["Estado"], "disponible"),
        description: text(record.fields, ["Descripción", "Descripcion"], ""),
        visibleToClient: field<boolean>(record.fields, ["Visible al cliente"], true),
      })),
    impactMetrics: parseImpactMetrics(projectRecord.fields),
    lastUpdated: latestActivityUpdate(activity, text(projectRecord.fields, ["Última actualización", "Ultima actualización", "Fecha de actualización", "Fecha actualizacion"], "")),
    source: { masterRecordId: masterClient.recordId, baseId: masterClient.baseId },
  };
}

function parseImpactMetrics(fields: Record<string, unknown>): ImpactMetric[] {
  const raw = field<unknown>(fields, ["Métricas de impacto", "Metricas de impacto", "Impacto"], []);
  if (Array.isArray(raw)) return raw.map(String).map((item) => ({ label: item, value: "" }));
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw.split("\n").map((line) => {
    const [label, value, note] = line.split("|").map((part) => part?.trim());
    return { label, value: value ?? "", note };
  }).filter((metric) => metric.label);
}


export type PortalAccessResolution = {
  masterClient: MasterClient;
  accessRecord: AirtableRecord;
  projectId: string;
  authorizedEmails: string[];
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function parseEmails(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(parseEmails);
  if (typeof value !== "string") return [];
  return value
    .split(/[\s,;]+/)
    .map(normalizeEmail)
    .filter((item) => item.includes("@"));
}

export async function resolvePortalAccess(accessToken: string): Promise<PortalAccessResolution | null> {
  if (!accessToken || accessToken === "demo") return null;
  const clients = await getMasterClients();
  const escapedToken = accessToken.replaceAll("'", "\\'");

  for (const masterClient of clients) {
    try {
      const accessFormula = `AND({Token}='${escapedToken}', {Estado}='activo')`;
      const accessRecords = await listRecords(masterClient.baseId, TABLES.accessPortal, { filterByFormula: accessFormula, maxRecords: 1 });
      const accessRecord = accessRecords[0];
      const projectId = list(accessRecord?.fields ?? {}, ["Proyecto"])[0];
      if (!accessRecord || !projectId) continue;

      return {
        masterClient,
        accessRecord,
        projectId,
        authorizedEmails: parseEmails(field(accessRecord.fields, ["Email stakeholder", "Emails autorizados", "Email", "Correo"])),
      };
    } catch (error) {
      console.warn(`Access resolution failed for ${masterClient.clientName}`, error);
    }
  }

  return null;
}

export async function isEmailAuthorizedForAccess(accessToken: string, email: string) {
  const access = await resolvePortalAccess(accessToken);
  if (!access) return false;
  const normalized = normalizeEmail(email);
  return access.authorizedEmails.includes(normalized);
}

export async function touchPortalAccess(accessToken: string) {
  const access = await resolvePortalAccess(accessToken);
  if (!access) return;
  const today = new Date().toISOString().slice(0, 10);
  await airtableFetch(`${API_ROOT}/${access.masterClient.baseId}/${encodeURIComponent(TABLES.accessPortal)}/${access.accessRecord.id}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { "Último uso": today }, typecast: true }),
  });
}

export async function createClientQuestion(accessToken: string, message: string) {
  const data = await resolveProjectByToken(accessToken);
  if (!data || accessToken === "demo") throw new Error("Project not found");
  const today = new Date().toISOString().slice(0, 10);
  return airtableFetch(`${API_ROOT}/${data.source.baseId}/${encodeURIComponent(TABLES.questions)}`, {
    method: "POST",
    body: JSON.stringify({
      typecast: true,
      fields: {
        Proyecto: [data.project.id],
        Autor: "cliente",
        Mensaje: message,
        Fecha: today,
        Estado: "sin responder",
      },
    }),
  });
}

export const demoPortalData: ClientPortalData = {
  client: { id: "demo-client", name: "BIA México", brandColor: "#2558D8", contactName: "Greta", contactEmail: "" },
  project: {
    id: "demo-project",
    name: "Plataforma HR",
    code: "BIA-MX",
    token: "demo",
    status: "en curso",
    startDate: "2026-08-01",
    targetEndDate: "2026-10-15",
    executiveSummary: "El proyecto ya tiene definida la estructura central y estamos validando la primera experiencia visible para el cliente. El siguiente paso es conectar los datos reales para que el portal refleje avances sin trabajo manual adicional.",
    nextMilestone: "Validar portal piloto con datos de BIA México",
    nextMilestoneDate: "2026-08-16",
    enabledSections: ["kanban", "hitos", "actividad", "preguntas", "archivos", "metricas"],
  },
  tasks: [
    { id: "t1", name: "Definir modelo de datos por cliente", status: "completado", dueDate: "2026-08-08", visibleToClient: true, isCurrent: false },
    { id: "t2", name: "Crear vínculos entre tablas en Airtable", status: "en progreso", dueDate: "2026-08-10", visibleToClient: true, isCurrent: true },
    { id: "t3", name: "Diseñar vista cliente de solo lectura", status: "en revisión", dueDate: "2026-08-12", visibleToClient: true, isCurrent: false },
    { id: "t4", name: "Cargar primer update real desde plantilla", status: "por hacer", dueDate: "2026-08-14", visibleToClient: true, isCurrent: false },
    { id: "t5", name: "Configurar acceso interno y variables de ambiente", status: "en progreso", dueDate: "2026-08-11", visibleToClient: false, isCurrent: true },
    { id: "t6", name: "Validar link real con datos de Airtable", status: "por hacer", dueDate: "2026-08-15", visibleToClient: true, isCurrent: false },
  ],
  milestones: [
    { id: "m1", name: "Modelo Airtable listo", estimatedDate: "2026-08-10", status: "alcanzado", actualDate: "2026-08-10" },
    { id: "m2", name: "Portal piloto navegable", estimatedDate: "2026-08-16", status: "pendiente" },
    { id: "m3", name: "Primer update operativo", estimatedDate: "2026-08-20", status: "pendiente" },
  ],
  activity: [
    { id: "a1", date: "2026-08-09", type: "nota", description: "Se acordó validar primero la vista del cliente con un solo proyecto piloto antes de construir el panel admin completo.", origin: "sesión" },
    { id: "a2", date: "2026-08-10", type: "tarea completada", description: "Quedó definido que Airtable será la única fuente de verdad y que cada cliente vivirá en su propia base.", origin: "hermes" },
  ],
  questions: [
    { id: "q1", author: "cliente", message: "¿El portal mostrará entregables finales y documentos de avance?", date: "2026-08-10", status: "respondido", answer: "Sí. Los entregables aparecerán en una sección de archivos cuando Chava decida publicarlos para el proyecto." },
  ],
  files: [
    { id: "f1", name: "PRD del portal", url: "#", date: "2026-08-09", category: "Definición" },
  ],
  impactMetrics: [
    { label: "Visibilidad", value: "24/7", note: "estado consultable sin pedir update" },
    { label: "Registro de avance", value: "< 1 min", note: "objetivo usando plantilla" },
  ],
  lastUpdated: { date: "2026-08-10", by: "Hermes" },
  source: { masterRecordId: "demo", baseId: "demo" },
};
