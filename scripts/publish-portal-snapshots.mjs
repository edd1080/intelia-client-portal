#!/usr/bin/env node
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const API_ROOT = 'https://api.airtable.com/v0';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const MASTER_BASE_ID = process.env.AIRTABLE_MASTER_BASE_ID || 'appw3DgL0Piib7MZP';
const MASTER_CLIENTS_TABLE_ID = process.env.AIRTABLE_MASTER_CLIENTS_TABLE_ID || 'tbl4Pwxo7jNpDxYXf';
const OUT_DIR = path.join(process.cwd(), 'data', 'portal');
const TABLES = {
  clients: 'Clientes',
  projects: 'Proyectos',
  accessPortal: 'Accesos Portal',
  tasks: 'Tareas',
  activity: 'Actividad',
  questions: 'Preguntas',
  milestones: 'Hitos',
  files: 'Archivos',
};

if (!AIRTABLE_API_KEY) throw new Error('Missing AIRTABLE_API_KEY');

async function airtable(pathname, init = {}) {
  const response = await fetch(`${API_ROOT}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const body = await response.text();
  const data = body ? JSON.parse(body) : {};
  if (!response.ok) throw new Error(`Airtable ${response.status}: ${JSON.stringify(data)}`);
  return data;
}

async function listRecords(baseId, tableName, query = {}) {
  const records = [];
  let offset;
  do {
    const params = new URLSearchParams({ pageSize: '100' });
    Object.entries(query).forEach(([key, value]) => params.set(key, String(value)));
    if (offset) params.set('offset', offset);
    const data = await airtable(`/${baseId}/${encodeURIComponent(tableName)}?${params.toString()}`);
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

function field(fields, names, fallback = undefined) {
  for (const name of names) {
    if (fields[name] !== undefined && fields[name] !== null && fields[name] !== '') return fields[name];
  }
  return fallback;
}
function text(fields, names, fallback = '') {
  const value = field(fields, names, fallback);
  if (Array.isArray(value)) return value.map(String).join(', ');
  return String(value ?? fallback);
}
function list(fields, names) {
  const value = field(fields, names, []);
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}
function numberValue(fields, names, fallback = 0) {
  const value = field(fields, names, fallback);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? '').replace('%', '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}
function linkedTo(record, fieldName, linkedRecordId) {
  const raw = record.fields[fieldName];
  return Array.isArray(raw) && raw.includes(linkedRecordId);
}
function firstAttachmentUrl(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0 && value[0] && typeof value[0] === 'object' && 'url' in value[0]) return String(value[0].url);
  return undefined;
}
function slug(value) {
  return String(value || 'project').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'project';
}
function uniqueProjectKey(baseId, projectRecord) {
  return `${slug(text(projectRecord.fields, ['Código', 'Codigo', 'Nombre', 'Proyecto'], projectRecord.id))}-${projectRecord.id.slice(3, 9)}`;
}

function publicProjectSlug(projectRecord) {
  const code = text(projectRecord.fields, ['Código', 'Codigo', 'Código corto', 'Codigo corto', 'Código del proyecto'], '').toUpperCase();
  const byCode = {
    'BIA-GT-TALENTHUB': 'talenthub',
    'BIA-GT-DATAHUB': 'datahub',
    'BIA-GT-PORTAL-VACACIONES': 'portal-vacaciones',
    'BIA-GT-PORTAL-BENEFICIOS': 'portal-beneficios',
    'BIA-GT-ONBOARDING-VIDEOS': 'onboarding-digital',
    'BIA-HN-COMPRAS-AI': 'compras-ai',
    'BIA-HN-MKT-INTELLIGENCE-CORE': 'intelligence-core',
    'BIA-MX-BIA-ONE-HR': 'bia-one',
  };
  if (byCode[code]) return byCode[code];
  return slug(text(projectRecord.fields, ['Nombre', 'Proyecto'], projectRecord.id));
}
function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}
function parseEmails(value) {
  if (Array.isArray(value)) return value.flatMap(parseEmails);
  if (typeof value !== 'string') return [];
  return value.split(/[\s,;]+/).map(normalizeEmail).filter((item) => item.includes('@'));
}
function humanizeOrigin(origin) {
  const normalized = origin.trim().toLowerCase();
  const labels = { hermes: 'Hermes', 'panel admin': 'Panel admin', 'claude-mcp': 'Claude', claude: 'Claude', cliente: 'Cliente', sesión: 'Sesión de trabajo', sesion: 'Sesión de trabajo' };
  return labels[normalized] || origin;
}
function latestActivityUpdate(activity, fallbackDate) {
  const dated = activity.filter((item) => item.date).sort((a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`));
  const latest = dated[0];
  return { date: latest?.date || fallbackDate, by: latest?.origin ? humanizeOrigin(latest.origin) : 'Intelia' };
}
function isTaskCurrent(status) {
  const normalized = status.toLowerCase();
  return normalized.includes('progreso') || normalized.includes('trabaj') || normalized.includes('doing') || normalized.includes('in progress');
}
function parseImpactMetrics(fields) {
  const raw = field(fields, ['Métricas de impacto', 'Metricas de impacto', 'Impacto'], []);
  if (Array.isArray(raw)) return raw.map(String).map((item) => ({ label: item, value: '' }));
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split('\n').map((line) => {
    const [label, value, note] = line.split('|').map((part) => part?.trim());
    return { label, value: value || '', note };
  }).filter((metric) => metric.label);
}

function buildPortalData(masterClient, projectRecord, tables) {
  const projectId = projectRecord.id;
  const linkedClientId = list(projectRecord.fields, ['Cliente'])[0];
  const clientRecord = tables.clients.find((record) => record.id === linkedClientId) || tables.clients[0];
  const milestoneRecords = tables.milestones.filter((record) => linkedTo(record, 'Proyecto', projectId));
  const milestonesById = new Map(milestoneRecords.map((record) => [record.id, text(record.fields, ['Nombre', 'Hito'])]));
  const tasks = tables.tasks.filter((record) => linkedTo(record, 'Proyecto', projectId)).map((record) => {
    const status = text(record.fields, ['Estado'], 'por hacer');
    return {
      id: record.id,
      name: text(record.fields, ['Nombre', 'Tarea']),
      status,
      dueDate: text(record.fields, ['Fecha estimada', 'Fecha'], ''),
      milestone: milestonesById.get(list(record.fields, ['Hito relacionado'])[0] || ''),
      visibleToClient: field(record.fields, ['Visible al cliente'], false),
      isCurrent: field(record.fields, ['Es actual'], isTaskCurrent(status)),
      description: text(record.fields, ['Descripción cliente', 'Descripcion cliente', 'Descripción', 'Notas internas'], ''),
      priority: text(record.fields, ['Prioridad'], ''),
      needsClientAction: field(record.fields, ['Necesita acción del cliente'], false),
      requiredAction: text(record.fields, ['Acción requerida', 'Accion requerida'], ''),
      ganttStart: text(record.fields, ['Fecha inicio Gantt', 'Fecha de inicio', 'Fecha'], ''),
      ganttEnd: text(record.fields, ['Fecha fin Gantt', 'Fecha estimada', 'Fecha'], ''),
      ganttProgress: numberValue(record.fields, ['Progreso Gantt %'], status.toLowerCase().includes('complet') ? 100 : isTaskCurrent(status) ? 50 : 0),
      ganttOrder: numberValue(record.fields, ['Orden Gantt'], 999),
      ganttDependencies: text(record.fields, ['Dependencias Gantt'], ''),
    };
  });
  const activity = tables.activity.filter((record) => linkedTo(record, 'Proyecto', projectId)).map((record) => ({
    id: record.id,
    date: text(record.fields, ['Fecha'], ''),
    type: text(record.fields, ['Tipo'], 'nota'),
    title: text(record.fields, ['Título', 'Titulo', 'Nombre'], ''),
    description: text(record.fields, ['Descripción', 'Descripcion', 'Descripción en lenguaje plano'], ''),
    clientMeaning: text(record.fields, ['Qué significa para el cliente', 'Que significa para el cliente'], ''),
    origin: text(record.fields, ['Origen'], ''),
    visibleToClient: field(record.fields, ['Visible al cliente'], true),
  })).sort((a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`));

  return {
    client: {
      id: clientRecord?.id || masterClient.recordId,
      name: clientRecord ? text(clientRecord.fields, ['Nombre', 'Cliente'], masterClient.clientName) : masterClient.clientName,
      logoUrl: clientRecord ? firstAttachmentUrl(field(clientRecord.fields, ['Logo', 'logo'])) : undefined,
      brandColor: clientRecord ? text(clientRecord.fields, ['Color de marca', 'Color', 'Brand color'], '#18213D') : '#18213D',
      contactName: clientRecord ? text(clientRecord.fields, ['Contacto principal', 'Contacto - Nombre', 'Contacto', 'Nombre contacto'], '') : '',
      contactEmail: clientRecord ? text(clientRecord.fields, ['Email contacto', 'Contacto - Email', 'Correo', 'Email'], '') : '',
    },
    project: {
      id: projectId,
      name: text(projectRecord.fields, ['Nombre', 'Proyecto']),
      code: text(projectRecord.fields, ['Código', 'Codigo', 'Código corto', 'Codigo corto', 'Código del proyecto']),
      token: text(projectRecord.fields, ['Token de acceso']),
      status: text(projectRecord.fields, ['Estado general', 'Estado'], 'en curso'),
      currentPhase: text(projectRecord.fields, ['Fase actual'], ''),
      progress: numberValue(projectRecord.fields, ['Progreso %', 'Progreso', 'Avance %'], 0),
      startDate: text(projectRecord.fields, ['Fecha de inicio'], ''),
      targetEndDate: text(projectRecord.fields, ['Fecha estimada de cierre', 'Fecha cierre estimada'], ''),
      executiveSummary: text(projectRecord.fields, ['Resumen ejecutivo'], 'El proyecto avanza conforme al plan y el siguiente paso ya está identificado.'),
      remainingExplanation: text(projectRecord.fields, ['Explicación del avance restante', 'Explicacion del avance restante'], ''),
      clientSignal: text(projectRecord.fields, ['Semáforo cliente', 'Semaforo cliente'], ''),
      clientMessage: text(projectRecord.fields, ['Mensaje para cliente'], ''),
      nextMilestone: text(projectRecord.fields, ['Próximo hito', 'Proximo hito'], ''),
      nextMilestoneDate: text(projectRecord.fields, ['Fecha próximo hito', 'Fecha proximo hito', 'Fecha del próximo hito'], ''),
      enabledSections: list(projectRecord.fields, ['Secciones habilitadas']),
    },
    tasks,
    milestones: milestoneRecords.map((record) => ({
      id: record.id,
      name: text(record.fields, ['Nombre', 'Hito']),
      estimatedDate: text(record.fields, ['Fecha estimada'], ''),
      actualDate: text(record.fields, ['Fecha real'], ''),
      status: text(record.fields, ['Estado'], 'pendiente'),
      description: text(record.fields, ['Descripción cliente', 'Descripcion cliente', 'Descripción'], ''),
      acceptanceCriteria: text(record.fields, ['Criterio de aceptación', 'Criterio de aceptacion'], ''),
    })),
    activity,
    questions: tables.questions.filter((record) => linkedTo(record, 'Proyecto', projectId)).map((record) => ({
      id: record.id,
      author: text(record.fields, ['Autor'], 'cliente'),
      message: text(record.fields, ['Mensaje', 'Pregunta'], ''),
      date: text(record.fields, ['Fecha'], ''),
      status: text(record.fields, ['Estado'], 'sin responder'),
      answer: text(record.fields, ['Respuesta'], ''),
      answeredAt: text(record.fields, ['Fecha de respuesta'], ''),
      requiresClientDecision: field(record.fields, ['Requiere decisión de cliente'], false),
    })),
    files: tables.files.filter((record) => linkedTo(record, 'Proyecto', projectId)).map((record) => ({
      id: record.id,
      name: text(record.fields, ['Nombre', 'Archivo']),
      url: text(record.fields, ['URL', 'Url', 'Link', 'url']),
      date: text(record.fields, ['Fecha'], ''),
      category: text(record.fields, ['Categoría', 'Categoria'], ''),
      status: text(record.fields, ['Estado'], 'disponible'),
      description: text(record.fields, ['Descripción', 'Descripcion'], ''),
      visibleToClient: field(record.fields, ['Visible al cliente'], true),
    })),
    impactMetrics: parseImpactMetrics(projectRecord.fields),
    lastUpdated: latestActivityUpdate(activity, text(projectRecord.fields, ['Última actualización', 'Ultima actualización', 'Fecha de actualización', 'Fecha actualizacion'], '')),
    source: { masterRecordId: masterClient.recordId, baseId: masterClient.baseId },
  };
}

const generatedAt = new Date().toISOString();
const masterClients = (await listRecords(MASTER_BASE_ID, MASTER_CLIENTS_TABLE_ID)).map((record) => ({
  recordId: record.id,
  clientName: text(record.fields, ['Cliente', 'Nombre del cliente', 'Nombre']),
  baseId: text(record.fields, ['Base ID', 'BaseId', 'Airtable Base ID']),
  status: text(record.fields, ['Estado'], 'Activo'),
})).filter((client) => client.baseId && client.status.toLowerCase() !== 'inactivo');

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(path.join(OUT_DIR, 'projects'), { recursive: true });

const access = [];
const projects = [];
for (const masterClient of masterClients) {
  const [clients, projectRecords, accessRecords, tasks, activity, questions, milestones, files] = await Promise.all([
    listRecords(masterClient.baseId, TABLES.clients),
    listRecords(masterClient.baseId, TABLES.projects),
    listRecords(masterClient.baseId, TABLES.accessPortal).catch(() => []),
    listRecords(masterClient.baseId, TABLES.tasks),
    listRecords(masterClient.baseId, TABLES.activity),
    listRecords(masterClient.baseId, TABLES.questions),
    listRecords(masterClient.baseId, TABLES.milestones),
    listRecords(masterClient.baseId, TABLES.files),
  ]);
  const tables = { clients, tasks, activity, questions, milestones, files };
  const projectKeyById = new Map();
  for (const projectRecord of projectRecords) {
    const key = uniqueProjectKey(masterClient.baseId, projectRecord);
    const publicSlug = publicProjectSlug(projectRecord);
    projectKeyById.set(projectRecord.id, key);
    const data = buildPortalData(masterClient, projectRecord, tables);
    writeFileSync(path.join(OUT_DIR, 'projects', `${key}.json`), `${JSON.stringify(data, null, 2)}\n`);
    projects.push({ key, publicSlug, id: projectRecord.id, baseId: masterClient.baseId, clientName: data.client.name, projectName: data.project.name, code: data.project.code });
  }
  for (const accessRecord of accessRecords) {
    if (String(accessRecord.fields.Estado || '').toLowerCase() !== 'activo') continue;
    const projectId = list(accessRecord.fields, ['Proyecto'])[0];
    const projectKey = projectKeyById.get(projectId);
    if (!projectKey) continue;
    const token = text(accessRecord.fields, ['Token']);
    if (!token) continue;
    const project = projects.find((item) => item.key === projectKey);
    for (const email of parseEmails(field(accessRecord.fields, ['Email stakeholder', 'Emails autorizados', 'Email', 'Correo']))) {
      access.push({
        token,
        email,
        stakeholder: text(accessRecord.fields, ['Stakeholder', 'Nombre'], ''),
        projectKey,
        publicSlug: project?.publicSlug,
        projectId,
        baseId: masterClient.baseId,
        accessRecordId: accessRecord.id,
        clientName: project?.clientName || masterClient.clientName,
        projectName: project?.projectName || projectId,
      });
    }
  }
}

writeFileSync(path.join(OUT_DIR, 'access-index.json'), `${JSON.stringify({ generatedAt, access }, null, 2)}\n`);
writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify({ generatedAt, projects, accessCount: access.length }, null, 2)}\n`);
console.log(JSON.stringify({ generatedAt, projects: projects.length, access: access.length, outDir: OUT_DIR }, null, 2));
