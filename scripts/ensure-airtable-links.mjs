#!/usr/bin/env node
/**
 * Creates the seven required link-to-another-record fields in BIA México.
 * Safe/idempotent behavior: it reads the schema first and skips fields that already exist.
 *
 * Required env:
 *   AIRTABLE_API_KEY with schema.bases:read + schema.bases:write on appsMPwrBUsQTVU49
 */
const API_ROOT = 'https://api.airtable.com/v0';
const BASE_ID = process.env.BIA_MX_BASE_ID ?? 'appsMPwrBUsQTVU49';
const token = process.env.AIRTABLE_API_KEY;

if (!token) {
  console.error('Missing AIRTABLE_API_KEY');
  process.exit(1);
}

const links = [
  { tableId: 'tblT5yp7hVIYohyBD', tableName: 'Proyectos', name: 'Cliente', linkedTableId: 'tblZUflmHgqaYixr1' },
  { tableId: 'tblShxWwU4dUfd3RX', tableName: 'Tareas', name: 'Proyecto', linkedTableId: 'tblT5yp7hVIYohyBD' },
  { tableId: 'tblShxWwU4dUfd3RX', tableName: 'Tareas', name: 'Hito relacionado', linkedTableId: 'tbllhFp9aAEk5lxmy' },
  { tableId: 'tblopfKTqkDHJVTD5', tableName: 'Actividad', name: 'Proyecto', linkedTableId: 'tblT5yp7hVIYohyBD' },
  { tableId: 'tblr7PnbZMOaZVEXJ', tableName: 'Preguntas', name: 'Proyecto', linkedTableId: 'tblT5yp7hVIYohyBD' },
  { tableId: 'tbllhFp9aAEk5lxmy', tableName: 'Hitos', name: 'Proyecto', linkedTableId: 'tblT5yp7hVIYohyBD' },
  { tableId: 'tblvo3Z2XL3fJ8eQQ', tableName: 'Archivos', name: 'Proyecto', linkedTableId: 'tblT5yp7hVIYohyBD' },
];

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
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(data)}`);
  }
  return data;
}

const schema = await airtable(`/meta/bases/${BASE_ID}/tables`);
const tablesById = new Map(schema.tables.map((table) => [table.id, table]));
let created = 0;
let skipped = 0;

for (const link of links) {
  const table = tablesById.get(link.tableId);
  if (!table) throw new Error(`Table not found: ${link.tableName} (${link.tableId})`);

  const existing = table.fields.find((field) => field.name === link.name);
  if (existing) {
    const ok = existing.type === 'multipleRecordLinks' && existing.options?.linkedTableId === link.linkedTableId;
    console.log(`${ok ? '✓' : '⚠'} ${link.tableName}.${link.name} already exists (${existing.type})`);
    skipped++;
    continue;
  }

  await airtable(`/meta/bases/${BASE_ID}/tables/${link.tableId}/fields`, {
    method: 'POST',
    body: JSON.stringify({
      name: link.name,
      type: 'multipleRecordLinks',
      options: { linkedTableId: link.linkedTableId },
    }),
  });
  console.log(`+ created ${link.tableName}.${link.name} -> ${link.linkedTableId}`);
  created++;
}

console.log(`Done. Created ${created}, skipped ${skipped}.`);
