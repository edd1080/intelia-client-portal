#!/usr/bin/env node
import crypto from 'node:crypto';

const API_ROOT = 'https://api.airtable.com/v0';
const BASE_ID = 'appM9RFgoYSE9AiPM';
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
  return `bia-hn-compras-${slug}_${crypto.randomBytes(9).toString('base64url')}`;
}

const client = await upsertByName(TABLES.clients, 'BIA Honduras', {
  'Color de marca': '#2558D8',
  'Contacto principal': 'Lady Matute / equipo de Compras',
  Estado: 'Activo',
});
console.log(`client: ${client.id}`);

const executiveSummary = `El prototipo del flujo de solicitud de compras ya fue realizado y compartido para revisión. El proyecto se mantiene pendiente de insumos clave del equipo de Compras —plantillas, ejemplos actuales, reglas de clasificación, asignación de coordinadores, reglas fiscales y definición del dominio— para iniciar el desarrollo con menor riesgo de retrabajo.

La solución digitalizará el proceso con una aplicación web guiada donde cualquier colaborador presenta una solicitud, el sistema la clasifica, pide la información faltante y genera el documento formal para proveedores. Luego Compras podrá cargar cotizaciones, generar un cuadro comparativo con impuestos desglosados y registrar una recomendación humana antes de enviar la decisión final al solicitante.

Esta primera fase se enfoca exclusivamente en el proceso de solicitud de compras. Las fases siguientes contemplan reportes de indicadores, Plan de Compras SNOP y medición de tiempos de atención integrada con Finanzas.`;

const projectName = 'Fase 1 - Solicitud de Compras';
const projectCode = 'BIA-COM-2026';
let project = (await list(TABLES.projects, `{Código}='${esc(projectCode)}'`))[0];
const projectFields = {
  Nombre: projectName,
  Código: projectCode,
  Cliente: [client.id],
  'Token de acceso': 'legacy-bia-hn-compras-fase1',
  'Estado general': 'en riesgo',
  'Fecha de inicio': '2026-04-07',
  'Resumen ejecutivo': executiveSummary,
  'Próximo hito': 'Recepción de insumos del equipo de Compras y definición del dominio de la aplicación',
  'Secciones habilitadas': ['kanban', 'hitos', 'actividad', 'preguntas', 'archivos', 'metricas'],
  'Métricas de impacto': [
    'Horas mensuales de trabajo manual en el área de Compras | 30 a 50 horas | Meta: reducirlo a 2–4 horas de revisión',
    'Tiempo de análisis comparativo de cotizaciones | 4 a 8 horas por compra compleja | Meta: menos de 30 minutos',
    'Tiempo de elaboración del Plan de Compras | 1 día completo por ciclo | Fase posterior: meta de 15–30 minutos',
    'Conversión de solicitudes en compras efectivas | No medible actualmente | La aplicación habilita esta medición desde el uso operativo',
    'Tiempo de atención de una solicitud de compra | No medible actualmente | Hoy hay solicitudes con más de cuatro meses sin visibilidad',
    'Reportes de indicadores elaborados manualmente | 8 a 10 reportes | Automatización contemplada en fase posterior',
    'Registros en la base de proveedores | Aproximadamente 1,200 | Base en depuración por parte del cliente',
  ].join('\n'),
  'Última actualización': '2026-08-09',
};
project = project ? await patchRecord(TABLES.projects, project.id, projectFields) : await create(TABLES.projects, projectFields);
console.log(`project: ${project.id}`);

const stakeholders = [
  ['Lady Matute', 'lady-matute', 'Todo el proyecto: resumen, hitos, kanban, actividad, preguntas, archivos y métricas.'],
  ['Débora', 'debora', 'Resumen ejecutivo, hitos, actividad y métricas.'],
  ['Greta', 'greta', 'Resumen ejecutivo, hitos, actividad y archivos.'],
  ['IT BIA Honduras', 'it', 'Hitos y preguntas relacionadas a dominio e infraestructura.'],
  ['Edgar Calderón (Intelia)', 'edgar-intelia', 'Todo el proyecto, incluidas tareas internas.'],
];
const tokens = [];
for (const [name, slug, notes] of stakeholders) {
  const accessName = `Link ${name} - ${projectName}`;
  const existing = (await list(TABLES.access, `{Nombre}='${esc(accessName)}'`))[0];
  const accessToken = existing?.fields?.Token || stakeholderToken(slug);
  const fields = {
    Nombre: accessName,
    Token: accessToken,
    Proyecto: [project.id],
    Stakeholder: name,
    Estado: 'activo',
    'Fecha de creación': '2026-08-09',
    'Notas internas': notes,
  };
  const access = existing ? await patchRecord(TABLES.access, existing.id, fields) : await create(TABLES.access, fields);
  tokens.push({ stakeholder: name, token: access.fields.Token });
}

const milestones = [
  ['Descubrimiento y levantamiento del proceso de Compras','2026-04-07','2026-04-07','alcanzado','Sesión inicial con el equipo de Compras para identificar oportunidades de automatización y mapear los procesos actuales del área.'],
  ['Entrega de propuesta y documentación de solución','2026-07-01','2026-07-01','alcanzado','Entrega de la propuesta ejecutiva con alcance, plan de trabajo por fases e inversión estimada, junto con la documentación técnica de respaldo.'],
  ['Validación de la propuesta con el equipo de Compras','2026-07-01','2026-07-23','alcanzado','Sesión de validación donde se acordó el alcance definitivo de la primera fase, enfocada en el proceso de solicitud de compras.'],
  ['Prototipo del flujo de compras realizado','2026-07-26','2026-07-26','alcanzado','Prototipo/flujo digitalizado de la solicitud de compras preparado y compartido para revisión.'],
  ['Recepción de insumos y definición del dominio',null,null,'pendiente','Recepción de plantillas y ejemplos actuales, más la definición de la dirección web donde vivirá la aplicación.'],
  ['Primera versión funcional — solicitud y generación de documento',null,null,'pendiente','Aplicación funcionando para presentar solicitudes, pedir información faltante y generar el documento formal para Compras.'],
  ['Segunda versión funcional — cotizaciones, comparativa y decisión',null,null,'pendiente','Carga de cotizaciones, cuadro comparativo con impuestos desglosados, recomendación del coordinador y selección final.'],
  ['Panel de seguimiento y métricas',null,null,'pendiente','Tablero con solicitudes, estado, tiempos y medición de conversión a compras efectivas.'],
  ['Piloto con el equipo de Compras',null,null,'pendiente','Uso real con Compras y grupo acotado de colaboradores.'],
  ['Apertura a toda la empresa',null,null,'pendiente','Puesta en producción y comunicación interna del nuevo canal único para solicitar compras.'],
];
const milestoneIds = new Map();
for (const [name, estimated, actual, status, description] of milestones) {
  const fields = { Nombre: name, Proyecto: [project.id], Estado: status };
  if (estimated) fields['Fecha estimada'] = estimated;
  if (actual) fields['Fecha real'] = actual;
  if (description) fields.Descripción = description; // harmless if field exists later; omit if not accepted is not harmless
  delete fields.Descripción;
  const rec = await upsertByName(TABLES.milestones, name, fields);
  milestoneIds.set(name, rec.id);
}

const tasks = [
  ['Creación del prototipo del flujo de solicitud de compras','completado','Prototipo del flujo de compras realizado',true,'Ajuste solicitado: el prototipo del flujo de compras ya fue realizado.'],
  ['Envío del flujo digitalizado al equipo de Compras para su revisión','en revisión','Recepción de insumos y definición del dominio',true,'Documento de 11 pasos enviado para comparar contra el flujo que el equipo de Compras está documentando.'],
  ['Recepción de ejemplos de documentos de cotización actuales','en progreso','Recepción de insumos y definición del dominio',true,'Solicitados: ejemplo de solicitud de cotización de telefonía, plantilla de marketing y cuadro comparativo en Excel.'],
  ['Definición del criterio formal para clasificar tipos de solicitud','en progreso','Recepción de insumos y definición del dominio',true,'A cargo del equipo de Compras.'],
  ['Definición de la dirección web de la aplicación','en progreso','Recepción de insumos y definición del dominio',true,'Prioridad declarada por el cliente; requiere confirmación de tecnología.'],
  ['Definición de las plantillas y campos mínimos por tipo de solicitud','en progreso','Recepción de insumos y definición del dominio',true,'A cargo del equipo de Compras; contempla variantes producto/servicio.'],
  ['Validación del prototipo del flujo de compras con Compras','en revisión','Recepción de insumos y definición del dominio',true,'Compras debe revisar el flujo prototipado y confirmar ajustes antes de iniciar desarrollo.'],
  ['Definición de la regla de asignación de solicitudes entre coordinadores','por hacer','Recepción de insumos y definición del dominio',true,'Definir cómo el sistema determina a cuál de los cuatro coordinadores corresponde cada solicitud.'],
  ['Confirmación de las reglas fiscales aplicables a las cotizaciones','por hacer','Recepción de insumos y definición del dominio',true,'Confirmar impuesto sobre ventas, exenciones o retenciones aplicables.'],
  ['Definición del alcance del ciclo de comparativa para solicitudes exploratorias y de proyecto','por hacer','Recepción de insumos y definición del dominio',true,'Falta definir cómo cierran solicitudes exploratorias y de proyecto.'],
  ['Definición del formato del número de referencia de cada solicitud','por hacer','Recepción de insumos y definición del dominio',false,'Detalle de implementación; llave que ata cotizaciones al ciclo correspondiente.'],
  ['Definición del remitente de los correos automáticos del sistema','por hacer','Recepción de insumos y definición del dominio',false,'Recomendación interna: cuenta propia del dominio de la aplicación.'],
  ['Documentación del cambio de alcance de la primera fase','por hacer','Recepción de insumos y definición del dominio',false,'Interno Intelia: alcance acordado difiere del originalmente cotizado.'],
  ['Construcción del formulario de solicitud y clasificación','por hacer','Primera versión funcional — solicitud y generación de documento',true,'Captura de campos base y clasificación del tipo de solicitud.'],
  ['Construcción del asistente que solicita la información faltante','por hacer','Primera versión funcional — solicitud y generación de documento',true,'El asistente pregunta dentro del estándar definido por Compras.'],
  ['Generación del documento formal en formato PDF','por hacer','Primera versión funcional — solicitud y generación de documento',true,'Debe replicar formato institucional; depende de recibir ejemplos.'],
  ['Notificación automática por correo al coordinador y al solicitante','por hacer','Primera versión funcional — solicitud y generación de documento',true,'Pendiente.'],
  ['Carga y lectura automática de cotizaciones de proveedores','por hacer','Segunda versión funcional — cotizaciones, comparativa y decisión',true,'Soportar PDF, Word e imagen.'],
  ['Generación del cuadro comparativo con impuestos desglosados','por hacer','Segunda versión funcional — cotizaciones, comparativa y decisión',true,'Formato editable y descargable.'],
  ['Campo de recomendación del coordinador de compras','por hacer','Segunda versión funcional — cotizaciones, comparativa y decisión',true,'La recomendación final siempre la escribe una persona.'],
  ['Envío de la comparativa al solicitante y registro de su decisión','por hacer','Segunda versión funcional — cotizaciones, comparativa y decisión',true,'El solicitante selecciona una opción desde un enlace.'],
  ['Panel de seguimiento de solicitudes','por hacer','Panel de seguimiento y métricas',true,'Tabla de procesos con estado, fechas y coordinador asignado.'],
  ['Medición de conversión de solicitudes en compras efectivas','por hacer','Panel de seguimiento y métricas',true,'Métrica de mayor valor para el cliente.'],
  ['Plan de pruebas y validación funcional','por hacer','Piloto con el equipo de Compras',false,'Interno Intelia; casos de prueba ya definidos.'],
];
for (const [name, status, milestone, visible, notes] of tasks) {
  const fields = { Nombre: name, Proyecto: [project.id], Estado: status, 'Visible al cliente': visible, 'Notas internas': notes };
  const mId = milestoneIds.get(milestone);
  if (mId) fields['Hito relacionado'] = [mId];
  await upsertByName(TABLES.tasks, name, fields);
}

const activities = [
  ['Descubrimiento Compras','2026-04-07','reunión','Sesión de descubrimiento con el equipo de Compras para levantar los procesos actuales del área e identificar oportunidades de automatización.','Intelia'],
  ['Entrega propuesta ejecutiva','2026-07-01','entregable','Entrega de la propuesta ejecutiva del proyecto, con alcance, plan de trabajo por fases e inversión estimada.','Intelia'],
  ['Validación propuesta Compras','2026-07-23','reunión','Sesión de validación de la propuesta con el equipo de Compras. Se revisó la solución punto por punto y se acordó enfocar la primera fase exclusivamente en el proceso de solicitud de compras.','Intelia / BIA Honduras'],
  ['Prototipo flujo compras realizado','2026-07-26','entregable','Se realizó y compartió el prototipo del flujo digitalizado de solicitud de compras para revisión del equipo de Compras.','Intelia'],
  ['Seguimiento insumos pendientes','2026-08-09','nota','El proyecto se mantiene a la espera de insumos del equipo de Compras y de la definición del dominio antes de iniciar desarrollo.','Hermes'],
];
for (const [name, date, type, description, origin] of activities) {
  await upsertByName(TABLES.activity, name, { Nombre: name, Proyecto: [project.id], Fecha: date, Tipo: type, Descripción: description, Origen: origin });
}

const questions = [
  ['¿Qué tan cómoda está BIA Honduras con que esta aplicación quede alojada en una dirección web corporativa compartida con otro proyecto en curso? La alternativa es habilitar una dirección nueva, lo que implica un costo anual recurrente.','2026-07-26'],
  ['¿Cómo debe determinar el sistema a cuál de los cuatro coordinadores de compras corresponde cada solicitud?','2026-07-27'],
  ['¿La validación fiscal de las cotizaciones considera únicamente el impuesto sobre ventas, o existen casos de exención o retención que el sistema deba reconocer?','2026-07-27'],
  ['Para las solicitudes exploratorias y las de proyecto, ¿el ciclo se cierra de la misma forma que para una solicitud de cotización, o requiere un tratamiento distinto?','2026-07-27'],
  ['Solicitud de ejemplos de documentos actuales: solicitud de cotización de telefonía, plantilla de marketing y cuadro comparativo en Excel utilizado por el equipo.','2026-07-26'],
  ['¿Está disponible el flujo del proceso documentado internamente por el equipo de Compras, para compararlo con el que preparamos y validar que no falte ningún paso?','2026-07-26'],
];
for (const [message, date] of questions) {
  const existing = (await list(TABLES.questions, `{Mensaje}='${esc(message)}'`))[0];
  const fields = { Mensaje: message, Proyecto: [project.id], Autor: 'lead', Fecha: date, Estado: 'sin responder' };
  existing ? await patchRecord(TABLES.questions, existing.id, fields) : await create(TABLES.questions, fields);
}

const files = [
  ['Propuesta ejecutiva — Compras Inteligente','2026-07-01','propuesta'],
  ['Resumen visual de la solución','2026-07-01','propuesta'],
  ['Flujo digitalizado del proceso de solicitud de compras','2026-07-26','documentación funcional'],
  ['Especificación técnica de la aplicación (preliminar)','2026-07-27','documentación técnica'],
  ['Informe de descubrimiento del área de Compras','2026-04-01','documentación interna'],
  ['Mapa de oportunidades de automatización',null,'documentación interna'],
  ['Estrategia y plan de trabajo',null,'documentación interna'],
  ['Matriz de priorización de iniciativas','2026-07-01','documentación interna'],
  ['Plan de implementación y arranque','2026-07-01','documentación interna'],
];
for (const [name, date, category] of files) {
  const fields = { Nombre: name, Proyecto: [project.id], Categoría: category };
  if (date) fields.Fecha = date;
  await upsertByName(TABLES.files, name, fields);
}

console.log('TOKENS');
for (const row of tokens) console.log(`${row.stakeholder}: ${row.token}`);
console.log(`PROJECT ${projectCode}: ${project.id}`);
