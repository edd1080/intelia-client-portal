#!/usr/bin/env node
import { BASE_TABLES, CLIENTS_TO_CREATE, LINK_FIELDS, MASTER_BASE_ID, MASTER_CLIENTS_TABLE_ID, WORKSPACE_ID } from './airtable-client-schema.mjs';

const API_ROOT = 'https://api.airtable.com/v0';
const token = process.env.AIRTABLE_API_KEY;

if (!token) {
  console.error('Missing AIRTABLE_API_KEY');
  process.exit(1);
}

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

function formula(value) {
  return encodeURIComponent(`{Cliente}='${value.replaceAll("'", "\\'")}'`);
}

async function findMasterRecord(clientName) {
  const result = await airtable(`/${MASTER_BASE_ID}/${MASTER_CLIENTS_TABLE_ID}?filterByFormula=${formula(clientName)}&maxRecords=1`);
  return result.records[0];
}

async function createBase({ baseName }) {
  return airtable('/meta/bases', {
    method: 'POST',
    body: JSON.stringify({
      name: baseName,
      workspaceId: WORKSPACE_ID,
      tables: BASE_TABLES,
    }),
  });
}

async function createLinks(baseId) {
  const schema = await airtable(`/meta/bases/${baseId}/tables`);
  const byName = new Map(schema.tables.map((table) => [table.name, table]));
  let created = 0;
  let skipped = 0;

  for (const link of LINK_FIELDS) {
    const table = byName.get(link.table);
    const linkedTable = byName.get(link.linkedTable);
    if (!table || !linkedTable) throw new Error(`Missing table for link ${link.table}.${link.name} -> ${link.linkedTable}`);
    const existing = table.fields.find((field) => field.name === link.name);
    if (existing) {
      skipped++;
      continue;
    }
    await airtable(`/meta/bases/${baseId}/tables/${table.id}/fields`, {
      method: 'POST',
      body: JSON.stringify({ name: link.name, type: 'multipleRecordLinks', options: { linkedTableId: linkedTable.id } }),
    });
    created++;
  }
  return { created, skipped };
}

async function upsertMasterRecord(clientName, baseId, notes) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = await findMasterRecord(clientName);
  const fields = {
    Cliente: clientName,
    'Base ID': baseId,
    Estado: 'Activo',
    'Fecha de alta': today,
    Notas: notes,
  };

  if (existing) {
    await airtable(`/${MASTER_BASE_ID}/${MASTER_CLIENTS_TABLE_ID}/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields, typecast: true }),
    });
    return { action: 'updated', recordId: existing.id };
  }

  const created = await airtable(`/${MASTER_BASE_ID}/${MASTER_CLIENTS_TABLE_ID}`, {
    method: 'POST',
    body: JSON.stringify({ fields, typecast: true }),
  });
  return { action: 'created', recordId: created.id };
}

for (const client of CLIENTS_TO_CREATE) {
  const existing = await findMasterRecord(client.clientName);
  let baseId = existing?.fields?.['Base ID'];

  if (baseId) {
    console.log(`✓ ${client.clientName}: master already points to ${baseId}`);
  } else {
    const base = await createBase(client);
    baseId = base.id;
    console.log(`+ ${client.clientName}: created base ${baseId}`);
  }

  const links = await createLinks(baseId);
  console.log(`  links: created ${links.created}, skipped ${links.skipped}`);

  const master = await upsertMasterRecord(client.clientName, baseId, client.notes);
  console.log(`  master ${master.action}: ${master.recordId}`);
}
