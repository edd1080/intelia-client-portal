#!/usr/bin/env node
import { LINK_FIELDS } from './airtable-client-schema.mjs';

const API_ROOT = 'https://api.airtable.com/v0';
const BASE_ID = process.env.BIA_MX_BASE_ID ?? 'appsMPwrBUsQTVU49';
const token = process.env.AIRTABLE_API_KEY;
const DATE_OPTIONS = { dateFormat: { name: 'iso', format: 'YYYY-MM-DD' } };

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

async function schema() {
  const data = await airtable(`/meta/bases/${BASE_ID}/tables`);
  return data.tables;
}

let tables = await schema();
let accessTable = tables.find((table) => table.name === 'Accesos Portal');

if (!accessTable) {
  accessTable = await airtable(`/meta/bases/${BASE_ID}/tables`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Accesos Portal',
      description: 'Tokens revocables por stakeholder/proyecto. Esta tabla determina qué proyecto se muestra en /p/<token>.',
      fields: [
        { name: 'Nombre', type: 'singleLineText' },
        { name: 'Token', type: 'singleLineText' },
        { name: 'Stakeholder', type: 'singleLineText' },
        { name: 'Email stakeholder', type: 'email' },
        { name: 'Estado', type: 'singleSelect', options: { choices: [{ name: 'activo' }, { name: 'revocado' }, { name: 'expirado' }] } },
        { name: 'Fecha de creación', type: 'date', options: DATE_OPTIONS },
        { name: 'Fecha de expiración', type: 'date', options: DATE_OPTIONS },
        { name: 'Último uso', type: 'date', options: DATE_OPTIONS },
        { name: 'Notas internas', type: 'multilineText' },
      ],
    }),
  });
  console.log('+ created table Accesos Portal');
} else {
  console.log('✓ table Accesos Portal already exists');
}

tables = await schema();
const byName = new Map(tables.map((table) => [table.name, table]));
let created = 0;
let skipped = 0;

for (const link of LINK_FIELDS) {
  const table = byName.get(link.table);
  const linkedTable = byName.get(link.linkedTable);
  if (!table || !linkedTable) throw new Error(`Missing table for link ${link.table}.${link.name} -> ${link.linkedTable}`);
  const existing = table.fields.find((field) => field.name === link.name);
  if (existing) {
    const ok = existing.type === 'multipleRecordLinks' && existing.options?.linkedTableId === linkedTable.id;
    console.log(`${ok ? '✓' : '⚠'} ${link.table}.${link.name} already exists (${existing.type})`);
    skipped++;
    continue;
  }
  await airtable(`/meta/bases/${BASE_ID}/tables/${table.id}/fields`, {
    method: 'POST',
    body: JSON.stringify({ name: link.name, type: 'multipleRecordLinks', options: { linkedTableId: linkedTable.id } }),
  });
  console.log(`+ created ${link.table}.${link.name} -> ${link.linkedTable}`);
  created++;
}

console.log(`Done. Created ${created}, skipped ${skipped}.`);
