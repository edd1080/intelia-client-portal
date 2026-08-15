#!/usr/bin/env node
import crypto from 'node:crypto';
import { writeFileSync } from 'node:fs';

const API_ROOT = 'https://api.airtable.com/v0';
const key = process.env.AIRTABLE_API_KEY;
if (!key) throw new Error('Missing AIRTABLE_API_KEY');

const ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.intelia.pro';

const BASES = {
  gt: 'appNcnN6leXDGTHu3',
  hn: 'appM9RFgoYSE9AiPM',
  mx: 'appsMPwrBUsQTVU49',
};

const TABLES = {
  clients: 'Clientes',
  projects: 'Proyectos',
  access: 'Accesos Portal',
};

const schemaCache = new Map();

const PROJECTS = [
  {
    baseId: BASES.gt,
    client: 'BIA Corporativo Guatemala',
    contactName: 'Lorena Orellana / Mayra Davila',
    contactEmail: 'lorellana@biafoods.com',
    name: 'TalentHub',
    code: 'BIA-GT-TALENTHUB',
    aliases: ['TalentHub', 'BIA-TALENT-OS'],
    status: 'en progreso',
    phase: 'Actualización de información del portal',
    stakeholders: ['mdavila@biafoods.com', 'lorellana@biafoods.com', 'edgarcalderon@outlook.com', 'edgar@intelia.pro'],
  },
  {
    baseId: BASES.gt,
    client: 'BIA Corporativo Guatemala',
    contactName: 'Lorena Orellana / Mayra Davila',
    contactEmail: 'lorellana@biafoods.com',
    name: 'Onboarding Digital (Videos)',
    code: 'BIA-GT-ONBOARDING-VIDEOS',
    status: 'en curso',
    phase: 'Shell inicial pendiente de carga detallada',
    stakeholders: ['mdavila@biafoods.com', 'lorellana@biafoods.com', 'edgarcalderon@outlook.com', 'edgar@intelia.pro'],
  },
  {
    baseId: BASES.gt,
    client: 'BIA Corporativo Guatemala',
    contactName: 'Lorena Orellana',
    contactEmail: 'lorellana@biafoods.com',
    name: 'DataHub',
    code: 'BIA-GT-DATAHUB',
    status: 'en curso',
    phase: 'Shell inicial pendiente de carga detallada',
    stakeholders: ['dzepeda@biafoods.com', 'lorellana@biafoods.com', 'edgarcalderon@outlook.com', 'edgar@intelia.pro'],
  },
  {
    baseId: BASES.gt,
    client: 'BIA Corporativo Guatemala',
    contactName: 'Lorena Orellana / Mario Reyes',
    contactEmail: 'lorellana@biafoods.com',
    name: 'Portal Vacaciones',
    code: 'BIA-GT-PORTAL-VACACIONES',
    status: 'en curso',
    phase: 'Shell inicial pendiente de carga detallada',
    stakeholders: ['mreyes@biafoods.com', 'lorellana@biafoods.com', 'edgarcalderon@outlook.com', 'edgar@intelia.pro'],
  },
  {
    baseId: BASES.gt,
    client: 'BIA Corporativo Guatemala',
    contactName: 'Lorena Orellana / Mario Reyes',
    contactEmail: 'lorellana@biafoods.com',
    name: 'Portal Beneficios',
    code: 'BIA-GT-PORTAL-BENEFICIOS',
    status: 'en curso',
    phase: 'Shell inicial pendiente de carga detallada',
    stakeholders: ['mreyes@biafoods.com', 'lorellana@biafoods.com', 'edgarcalderon@outlook.com', 'edgar@intelia.pro'],
  },
  {
    baseId: BASES.hn,
    client: 'BIA Honduras',
    contactName: 'Greta Salguero / Lady Matute',
    contactEmail: 'gsalguero@biafoods.com',
    name: 'Proyecto Solicitud de Compras AI',
    code: 'BIA-HN-COMPRAS-AI',
    aliases: ['Fase 1 - Solicitud de Compras', 'BIA-COM-2026'],
    status: 'en riesgo',
    phase: 'Actualización de información del portal',
    stakeholders: ['lmatute@biabrands.co', 'gsalguero@biafoods.com', 'dpiox@biabrands.co', 'edgarcalderon@outlook.com', 'edgar@intelia.pro'],
  },
  {
    baseId: BASES.hn,
    client: 'BIA Honduras',
    contactName: 'Greta Salguero / Marketing BIA Honduras',
    contactEmail: 'gsalguero@biafoods.com',
    name: 'Proyecto Intelligence Core Dashboard',
    code: 'BIA-HN-MKT-INTELLIGENCE-CORE',
    status: 'en curso',
    phase: 'Shell inicial pendiente de carga detallada',
    stakeholders: ['nchahin@biabrands.co', 'danielam@biabrands.co', 'mduque@biabrands.co', 'gsalguero@biafoods.com', 'dpiox@biabrands.co', 'edgarcalderon@outlook.com', 'edgar@intelia.pro', 'aisolis@gmail.com', 'alder@intelia.pro'],
  },
  {
    baseId: BASES.mx,
    client: 'BIA México',
    contactName: 'BIA México HR',
    contactEmail: 'agomex@biafoods.com',
    name: 'BIA One (Plataforma HR)',
    code: 'BIA-MX-BIA-ONE-HR',
    aliases: ['Plataforma HR'],
    status: 'en curso',
    phase: 'Shell inicial pendiente de carga detallada',
    stakeholders: ['agomex@biafoods.com', 'dulces@cafepuntadelcielo.co', 'edgarcalderon@outlook.com', 'edgar@intelia.pro', 'floresmauricio@outlook.com', 'mauricio@intelia.pro'],
  },
];

async function airtable(path, init = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(data)}`);
  return data;
}

async function tableFieldNames(baseId, tableName) {
  const cacheKey = `${baseId}:${tableName}`;
  if (schemaCache.has(cacheKey)) return schemaCache.get(cacheKey);
  const schema = await airtable(`/meta/bases/${baseId}/tables`);
  const table = schema.tables.find((item) => item.name === tableName);
  if (!table) throw new Error(`Missing table ${tableName} in ${baseId}`);
  const names = new Set(table.fields.map((field) => field.name));
  schemaCache.set(cacheKey, names);
  return names;
}

async function allowedFields(baseId, table, fields) {
  const names = await tableFieldNames(baseId, table);
  return Object.fromEntries(Object.entries(fields).filter(([name]) => names.has(name)));
}

function enc(value) { return encodeURIComponent(value); }
function esc(value) { return String(value).replaceAll("'", "\\'"); }
function today() { return new Date().toISOString().slice(0, 10); }
function slug(value) { return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48); }
function makeToken(code, email) { return `${slug(code)}-${slug(email)}_${crypto.randomBytes(12).toString('base64url')}`; }

async function list(baseId, table, formula) {
  const all = [];
  let offset;
  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (formula) params.set('filterByFormula', formula);
    if (offset) params.set('offset', offset);
    const data = await airtable(`/${baseId}/${enc(table)}?${params}`);
    all.push(...data.records);
    offset = data.offset;
  } while (offset);
  return all;
}
async function create(baseId, table, fields) {
  return airtable(`/${baseId}/${enc(table)}`, { method: 'POST', body: JSON.stringify({ fields: await allowedFields(baseId, table, fields), typecast: true }) });
}
async function patchRecord(baseId, table, id, fields) {
  return airtable(`/${baseId}/${enc(table)}/${id}`, { method: 'PATCH', body: JSON.stringify({ fields: await allowedFields(baseId, table, fields), typecast: true }) });
}
function getField(fields, names) {
  for (const name of names) if (fields[name]) return Array.isArray(fields[name]) ? fields[name][0] : String(fields[name]);
  return '';
}

async function ensureClient(project) {
  const existing = (await list(project.baseId, TABLES.clients, `{Nombre}='${esc(project.client)}'`))[0];
  const fields = {
    Nombre: project.client,
    'Color de marca': '#2558D8',
    'Contacto principal': project.contactName,
    'Email contacto': project.contactEmail,
    'Contacto - Nombre': project.contactName,
    'Contacto - Email': project.contactEmail,
    Estado: 'Activo',
  };
  return existing ? patchRecord(project.baseId, TABLES.clients, existing.id, fields) : create(project.baseId, TABLES.clients, fields);
}

async function findProject(project) {
  const projects = await list(project.baseId, TABLES.projects);
  const aliases = new Set([project.name, project.code, ...(project.aliases || [])].map((item) => String(item).toLowerCase()));
  return projects.find((record) => aliases.has(getField(record.fields, ['Código', 'Codigo']).toLowerCase()) || aliases.has(getField(record.fields, ['Nombre', 'Proyecto']).toLowerCase()));
}

async function ensureProject(project, clientRecord) {
  const existing = await findProject(project);
  const identityFields = {
    Nombre: project.name,
    Código: project.code,
    Cliente: [clientRecord.id],
    'Estado general': project.status,
    'Fase actual': project.phase,
  };
  const shellFields = {
    ...identityFields,
    'Progreso %': 0,
    'Resumen ejecutivo': 'Proyecto agregado al portal de clientes Intelia. La información detallada se cargará desde la plantilla oficial de actualización del proyecto.',
    'Explicación del avance restante': 'Pendiente de cargar avance real, próximos hitos, tareas y entregables desde Airtable.',
    'Próximo hito': 'Cargar información oficial del proyecto',
    'Semáforo cliente': 'atención',
    'Mensaje para cliente': 'Este portal ya está creado. El equipo Intelia está actualizando la información visible para mostrar estado, próximos pasos y decisiones pendientes.',
    'Última actualización': today(),
    'Actualizado por': 'Hermes',
    'Secciones habilitadas': ['kanban', 'hitos', 'actividad', 'preguntas', 'archivos', 'metricas'],
  };
  if (existing) return patchRecord(project.baseId, TABLES.projects, existing.id, identityFields);
  return create(project.baseId, TABLES.projects, shellFields);
}

async function ensureAccess(project, projectRecord, email) {
  const records = await list(project.baseId, TABLES.access);
  const existing = records.find((record) => {
    const linked = Array.isArray(record.fields.Proyecto) && record.fields.Proyecto.includes(projectRecord.id);
    const recordEmail = String(record.fields['Email stakeholder'] || record.fields.Email || record.fields.Correo || '').toLowerCase();
    return linked && recordEmail === email.toLowerCase();
  });
  const token = existing?.fields?.Token || makeToken(project.code, email);
  const stakeholder = email.split('@')[0];
  const fields = {
    Nombre: `${project.name} · ${email}`,
    Token: token,
    Proyecto: [projectRecord.id],
    Stakeholder: stakeholder,
    'Email stakeholder': email,
    Estado: 'activo',
    'Fecha de creación': today(),
    'Notas internas': `Acceso individual generado para ${project.name}`,
  };
  const saved = existing ? await patchRecord(project.baseId, TABLES.access, existing.id, fields) : await create(project.baseId, TABLES.access, fields);
  return { email, stakeholder, token: saved.fields.Token };
}

const links = [];
for (const project of PROJECTS) {
  const client = await ensureClient(project);
  const savedProject = await ensureProject(project, client);
  for (const email of project.stakeholders) {
    const access = await ensureAccess(project, savedProject, email);
    links.push({
      Cliente: project.client,
      Proyecto: project.name,
      Email: access.email,
      URL: `${ORIGIN}/p/${access.token}`,
    });
  }
}

const csv = [
  'Cliente,Proyecto,Email,URL',
  ...links.map((row) => [row.Cliente, row.Proyecto, row.Email, row.URL].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')),
].join('\n');
writeFileSync('project-portal-links.csv', csv);

console.log(JSON.stringify({ projects: PROJECTS.length, links: links.length, csv: 'project-portal-links.csv', links }, null, 2));
