#!/usr/bin/env node
import { LINK_FIELDS, MASTER_BASE_ID, MASTER_CLIENTS_TABLE_ID } from './airtable-client-schema.mjs';

const API_ROOT = 'https://api.airtable.com/v0';
const token = process.env.AIRTABLE_API_KEY;
if (!token) throw new Error('Missing AIRTABLE_API_KEY');

async function airtable(path) {
  const response = await fetch(`${API_ROOT}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await response.text();
  const data = body ? JSON.parse(body) : {};
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(data)}`);
  return data;
}

const master = await airtable(`/${MASTER_BASE_ID}/${MASTER_CLIENTS_TABLE_ID}?pageSize=100`);
console.log(`Master records: ${master.records.length}`);
for (const rec of master.records) {
  const client = rec.fields.Cliente;
  const baseId = rec.fields['Base ID'];
  const status = rec.fields.Estado;
  console.log(`- ${client}: ${baseId} (${status})`);
  if (!baseId) continue;
  const schema = await airtable(`/meta/bases/${baseId}/tables`);
  const tableNames = schema.tables.map((table) => table.name);
  console.log(`  tables: ${tableNames.join(', ')}`);
  const byName = new Map(schema.tables.map((table) => [table.name, table]));
  for (const link of LINK_FIELDS) {
    const table = byName.get(link.table);
    const linked = byName.get(link.linkedTable);
    const field = table?.fields.find((candidate) => candidate.name === link.name);
    const ok = field?.type === 'multipleRecordLinks' && field?.options?.linkedTableId === linked?.id;
    if (!ok) console.log(`  MISSING/LINK MISMATCH: ${link.table}.${link.name} -> ${link.linkedTable}`);
  }
}
