#!/usr/bin/env node
import crypto from 'node:crypto';

const API_ROOT = 'https://api.airtable.com/v0';
const BASE_ID = 'appNcnN6leXDGTHu3';
const token = process.env.AIRTABLE_API_KEY;
if (!token) throw new Error('Missing AIRTABLE_API_KEY');

const TABLES = {
  clients: 'Clientes',
  projects: 'Proyectos',
  access: 'Accesos Portal',
  tasks: 'Tareas',
  activity: 'Actividad',
  questions: 'Preguntas',
  milestones: 'Hitos',
  files: 'Archivos',
};

async function airtable(path, init = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const body = await response.text();
  const data = body ? JSON.parse(body) : {};
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(data)}`);
  return data;
}

function encTable(table) { return encodeURIComponent(table); }
function esc(value) { return String(value).replaceAll("'", "\\'"); }
async function list(table, formula) {
  const query = formula ? `?filterByFormula=${encodeURIComponent(formula)}&pageSize=100` : '?pageSize=100';
  const data = await airtable(`/${BASE_ID}/${encTable(table)}${query}`);
  return data.records;
}
async function create(table, fields) {
  return airtable(`/${BASE_ID}/${encTable(table)}`, { method: 'POST', body: JSON.stringify({ fields, typecast: true }) });
}
async function patchRecord(table, id, fields) {
  return airtable(`/${BASE_ID}/${encTable(table)}/${id}`, { method: 'PATCH', body: JSON.stringify({ fields, typecast: true }) });
}
async function upsertByName(table, name, fields) {
  const found = await list(table, `{Nombre}='${esc(name)}'`);
  if (found[0]) return patchRecord(table, found[0].id, fields);
  return create(table, { Nombre: name, ...fields });
}
function stakeholderToken(slug) {
  return `bia-talent-os-${slug}_${crypto.randomBytes(9).toString('base64url')}`;
}

const client = await upsertByName(TABLES.clients, 'BIA Foods', {
  'Color de marca': '#2558D8',
  'Contacto principal': 'Lorena Orellana / Mayra Davila',
  'Email contacto': 'lorellana@biafoods.com',
  Estado: 'Activo',
});
console.log(`client: ${client.id}`);

const executiveSummary = `BIA Foods está desarrollando una plataforma propietaria de reclutamiento y selección, exclusiva para su operación. La solución elimina la dependencia de plataformas externas y centraliza el ciclo de talento: aplicación móvil del candidato, análisis de CVs con inteligencia artificial, aprobación de ternas, evaluación, negociación salarial y onboarding digital.

El sistema ya completó los módulos base de reclutamiento, selección y onboarding. En esta etapa se trabaja sobre refinamientos importantes: ajustes al diseño visual corporativo, mejoras de precisión de la IA para interpretar información en currículums y flujos de comunicación institucional, incluyendo notificaciones por correo y automatizaciones relacionadas con la preselección de candidatos.

El foco actual es hacer que la experiencia se sienta más alineada a BIA, sea más clara para líderes y reclutadores, y reduzca trabajo manual en decisiones recurrentes del proceso de talento.`;

const projectName = 'TalentHub';
const projectCode = 'BIA-TALENT-OS';
let project = (await list(TABLES.projects, `{Código}='${esc(projectCode)}'`))[0];
const projectFields = {
  Nombre: projectName,
  Código: projectCode,
  Cliente: [client.id],
  'Token de acceso': 'legacy-bia-talent-os',
  'Estado general': 'en progreso',
  'Fecha de inicio': '2025-12-31',
  'Resumen ejecutivo': executiveSummary,
  'Próximo hito': 'Optimizaciones de IA y flujo de notificaciones institucionales',
  'Secciones habilitadas': ['kanban', 'hitos', 'actividad', 'preguntas', 'archivos', 'metricas'],
  'Métricas de impacto': [
    'Desarrollo Core (Módulos Base) | 100% | Las fases operativas principales de reclutamiento y onboarding se completaron según el plan base inicial. El proyecto está en refinamiento de experiencia e IA.',
  ].join('\n'),
  'Última actualización': '2026-08-10',
};
project = project ? await patchRecord(TABLES.projects, project.id, projectFields) : await create(TABLES.projects, projectFields);
console.log(`project: ${project.id}`);

const stakeholders = [
  ['Lorena Orellana / Mayra Davila', 'lorena-mayra', 'lorellana@biafoods.com', 'Interfaz de terna de candidatos, revisión de perfiles y evaluación.'],
  ['Reclutadores / RH', 'reclutadores-rh', '', 'Portal de administración completo, seguimiento de candidatos, tableros de onboarding y configuración de vacantes.'],
];
const tokens = [];
for (const [name, slug, email, notes] of stakeholders) {
  const accessName = `Link ${name} - ${projectName}`;
  const existing = (await list(TABLES.access, `{Nombre}='${esc(accessName)}'`))[0];
  const accessToken = existing?.fields?.Token || stakeholderToken(slug);
  const fields = {
    Nombre: accessName,
    Token: accessToken,
    Proyecto: [project.id],
    Stakeholder: name,
    Estado: 'activo',
    'Fecha de creación': '2026-08-10',
    'Notas internas': notes,
  };
  if (email) fields['Email stakeholder'] = email;
  const access = existing ? await patchRecord(TABLES.access, existing.id, fields) : await create(TABLES.access, fields);
  tokens.push({ stakeholder: name, token: access.fields.Token });
}

const milestones = [
  ['Fase 0-9: Reclutamiento & Selección', null, '2025-12-31', 'alcanzado'],
  ['Fase 10: Onboarding Quick Wins', null, '2026-02-09', 'alcanzado'],
  ['Fases 11-12: Onboarding Operations & Analytics', null, '2026-02-24', 'alcanzado'],
  ['Rediseño Corporativo BIA y Optimizaciones (Fase actual)', null, null, 'en progreso'],
];
const milestoneIds = new Map();
for (const [name, estimated, actual, status] of milestones) {
  const fields = { Nombre: name, Proyecto: [project.id], Estado: status };
  if (estimated) fields['Fecha estimada'] = estimated;
  if (actual) fields['Fecha real'] = actual;
  const rec = await upsertByName(TABLES.milestones, name, fields);
  milestoneIds.set(name, rec.id);
}

const tasks = [
  ['Rediseño visual del portal de Onboarding', 'en revisión', 'Rediseño Corporativo BIA y Optimizaciones (Fase actual)', true, 'Aplicación del nuevo sistema de diseño, manteniendo colores categóricos y limpiando las tarjetas de progreso.'],
  ['Unificación del generador de PDFs para propuestas', 'completado', 'Rediseño Corporativo BIA y Optimizaciones (Fase actual)', false, 'Integración técnica de la librería pdfme para unificar la generación de reportes y documentos a lo largo de toda la app.'],
  ['Ajuste de IA para estandarizar análisis de inglés', 'por hacer', 'Rediseño Corporativo BIA y Optimizaciones (Fase actual)', false, 'Ajustar system prompt de GPT-4o para que analice formatos no estructurados en CVs: porcentajes, barras gráficas y puntos.'],
  ['Segundo resumen de candidato estructurado por IA', 'por hacer', 'Rediseño Corporativo BIA y Optimizaciones (Fase actual)', true, 'Crear un extracto rápido del perfil con grado académico, última experiencia laboral, inglés, salario, habilidades generales y únicamente fortalezas.'],
  ['Automatizar correo de introducción al preseleccionar', 'por hacer', 'Rediseño Corporativo BIA y Optimizaciones (Fase actual)', true, 'Integrar el nuevo template institucional de correo cuando el candidato cambie de estado a preselección.'],
];
for (const [name, status, milestone, visible, notes] of tasks) {
  const fields = { Nombre: name, Proyecto: [project.id], Estado: status, 'Visible al cliente': visible, 'Notas internas': notes };
  const mId = milestoneIds.get(milestone);
  if (mId) fields['Hito relacionado'] = [mId];
  await upsertByName(TABLES.tasks, name, fields);
}

const activities = [
  ['Fix validación correos duplicados', '2026-08-07', 'nota', 'Corrección de un problema técnico de validación de correos electrónicos duplicados al editar perfiles de candidatos.', 'sesión'],
  ['Mejoras visuales y negociaciones salariales', '2026-08-04', 'nota', 'Implementación de mejoras visuales en los portales públicos y desarrollo del registro histórico de negociaciones en ofertas salariales.', 'sesión'],
  ['Unificación motor PDF', '2026-08-04', 'nota', 'Unificación técnica del motor de creación de documentos PDF.', 'sesión'],
];
for (const [name, date, type, description, origin] of activities) {
  await upsertByName(TABLES.activity, name, { Nombre: name, Proyecto: [project.id], Fecha: date, Tipo: type, Descripción: description, Origen: origin });
}

const questions = [
  ['¿Cómo podemos mejorar el sistema de IA para que pueda interpretar y estandarizar el nivel de inglés cuando los candidatos usan diseños con porcentajes, puntos o barras en sus currículums?'],
  ['Necesitamos que la herramienta de IA genere un segundo resumen enfocado puramente en datos duros: último grado académico, experiencia más reciente, inglés, pretensión salarial, habilidades y exclusivamente las fortalezas.'],
  ['Necesitamos cambiar el proceso actual para que, en el momento que se preseleccione a una persona, se le envíe un correo de presentación sobre BIA Foods de forma automática.'],
];
for (const [message] of questions) {
  const existing = (await list(TABLES.questions, `{Mensaje}='${esc(message)}'`))[0];
  const fields = { Mensaje: message, Proyecto: [project.id], Autor: 'cliente', Estado: 'sin responder' };
  existing ? await patchRecord(TABLES.questions, existing.id, fields) : await create(TABLES.questions, fields);
}

const files = [
  ['Visión del Producto y Estructura (README)', '2026-08-10', 'Documento'],
  ['Plan de Desarrollo V2 (Hitos)', '2026-02-24', 'Documento'],
  ['Bitácora de Cambios (Changelog Histórico)', '2026-08-10', 'Documento'],
];
for (const [name, date, category] of files) {
  const fields = { Nombre: name, Proyecto: [project.id], Categoría: category };
  if (date) fields.Fecha = date;
  await upsertByName(TABLES.files, name, fields);
}

console.log('TOKENS');
for (const row of tokens) console.log(`${row.stakeholder}: ${row.token}`);
console.log(`PROJECT ${projectCode}: ${project.id}`);
