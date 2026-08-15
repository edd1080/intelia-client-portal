const API_ROOT = 'https://api.airtable.com/v0';
const MASTER_BASE_ID = process.env.AIRTABLE_MASTER_BASE_ID || 'appw3DgL0Piib7MZP';
const MASTER_CLIENTS_TABLE_ID = process.env.AIRTABLE_MASTER_CLIENTS_TABLE_ID || 'tbl4Pwxo7jNpDxYXf';

const key = process.env.AIRTABLE_API_KEY;
if (!key) {
  console.error('Missing AIRTABLE_API_KEY');
  process.exit(1);
}

const DATE_OPTIONS = { dateFormat: { name: 'iso', format: 'YYYY-MM-DD' } };
const CHECKBOX_OPTIONS = { icon: 'check', color: 'greenBright' };

const select = (choices) => ({ choices: choices.map((name) => ({ name })) });

const REQUIRED_FIELDS = {
  Proyectos: [
    { name: 'Fase actual', type: 'singleLineText' },
    { name: 'Progreso %', type: 'number', options: { precision: 0 } },
    { name: 'Explicación del avance restante', type: 'multilineText' },
    { name: 'Semáforo cliente', type: 'singleSelect', options: select(['tranquilo', 'atención', 'decisión requerida']) },
    { name: 'Mensaje para cliente', type: 'multilineText' },
    { name: 'Actualizado por', type: 'singleLineText' },
  ],
  Actividad: [
    { name: 'Título', type: 'singleLineText' },
    { name: 'Qué significa para el cliente', type: 'multilineText' },
    { name: 'Visible al cliente', type: 'checkbox', options: CHECKBOX_OPTIONS },
  ],
  Tareas: [
    { name: 'Descripción cliente', type: 'multilineText' },
    { name: 'Prioridad', type: 'singleSelect', options: select(['alta', 'media', 'baja']) },
    { name: 'Es actual', type: 'checkbox', options: CHECKBOX_OPTIONS },
    { name: 'Necesita acción del cliente', type: 'checkbox', options: CHECKBOX_OPTIONS },
    { name: 'Acción requerida', type: 'multilineText' },
    { name: 'Fecha inicio Gantt', type: 'date', options: DATE_OPTIONS },
    { name: 'Fecha fin Gantt', type: 'date', options: DATE_OPTIONS },
    { name: 'Progreso Gantt %', type: 'number', options: { precision: 0 } },
    { name: 'Orden Gantt', type: 'number', options: { precision: 0 } },
    { name: 'Dependencias Gantt', type: 'multilineText' },
  ],
  Hitos: [
    { name: 'Descripción cliente', type: 'multilineText' },
    { name: 'Criterio de aceptación', type: 'multilineText' },
    { name: 'Orden Gantt', type: 'number', options: { precision: 0 } },
  ],
  Preguntas: [
    { name: 'Requiere decisión de cliente', type: 'checkbox', options: CHECKBOX_OPTIONS },
  ],
  Archivos: [
    { name: 'Archivo adjunto', type: 'multipleAttachments' },
    { name: 'Estado', type: 'singleSelect', options: select(['disponible', 'pendiente', 'reemplazado']) },
    { name: 'Descripción', type: 'multilineText' },
    { name: 'Visible al cliente', type: 'checkbox', options: CHECKBOX_OPTIONS },
  ],
};

async function api(path, init = {}) {
  const res = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.error?.message || data?.error?.type || text;
    throw new Error(`${res.status} ${message}`);
  }
  return data;
}

async function listRecords(baseId, tableId) {
  const all = [];
  let offset;
  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (offset) params.set('offset', offset);
    const data = await api(`/${baseId}/${encodeURIComponent(tableId)}?${params}`);
    all.push(...data.records);
    offset = data.offset;
  } while (offset);
  return all;
}

async function getClientBases() {
  const records = await listRecords(MASTER_BASE_ID, MASTER_CLIENTS_TABLE_ID);
  return records
    .map((record) => ({
      name: record.fields.Cliente || record.fields['Nombre del cliente'] || record.fields.Nombre || record.id,
      baseId: record.fields['Base ID'] || record.fields.BaseId || record.fields['Airtable Base ID'],
      status: record.fields.Estado || 'Activo',
    }))
    .filter((item) => item.baseId && String(item.status).toLowerCase() !== 'inactivo');
}

async function ensureFieldsForBase(client) {
  const schema = await api(`/meta/bases/${client.baseId}/tables`);
  const tablesByName = new Map(schema.tables.map((table) => [table.name, table]));
  const created = [];
  const existing = [];
  const missingTables = [];

  for (const [tableName, fields] of Object.entries(REQUIRED_FIELDS)) {
    const table = tablesByName.get(tableName);
    if (!table) {
      missingTables.push(tableName);
      continue;
    }
    const fieldNames = new Set(table.fields.map((field) => field.name));
    for (const field of fields) {
      if (fieldNames.has(field.name)) {
        existing.push(`${tableName}.${field.name}`);
        continue;
      }
      await api(`/meta/bases/${client.baseId}/tables/${table.id}/fields`, {
        method: 'POST',
        body: JSON.stringify(field),
      });
      created.push(`${tableName}.${field.name}`);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  return { client: client.name, baseId: client.baseId, created, existingCount: existing.length, missingTables };
}

const clients = await getClientBases();
const results = [];
for (const client of clients) {
  try {
    results.push(await ensureFieldsForBase(client));
  } catch (error) {
    results.push({ client: client.name, baseId: client.baseId, error: error.message });
  }
}
console.log(JSON.stringify(results, null, 2));
