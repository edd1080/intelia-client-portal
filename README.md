# Portal de Proyectos Intelia

MVP en Next.js para validar la vista de cliente de solo lectura leyendo desde Airtable como fuente única de verdad.

## Estado actual

- Portal cliente disponible en `/p/[token]`.
- Demo visual sin Airtable en `/p/demo`.
- Lectura real diseñada para resolver el token así:
  1. consulta el registro maestro `appw3DgL0Piib7MZP / tbl4Pwxo7jNpDxYXf`,
  2. obtiene las bases activas de clientes,
  3. busca el proyecto cuyo `Token de acceso` coincida,
  4. lee secciones, tareas visibles, hitos, actividad, preguntas y archivos desde la base del cliente.
- Las preguntas del cliente se escriben a Airtable vía `POST /api/questions`.

## Variables de entorno

Copia `.env.example` a `.env.local`:

```bash
AIRTABLE_API_KEY=pat_xxx
AIRTABLE_MASTER_BASE_ID=appw3DgL0Piib7MZP
AIRTABLE_MASTER_CLIENTS_TABLE_ID=tbl4Pwxo7jNpDxYXf
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Comandos

```bash
npm install
npm run dev
npm run build
```

## Airtable: vínculos pendientes

La app espera estos campos de tipo `multipleRecordLinks` en BIA México:

| Tabla | Campo | Apunta a |
| --- | --- | --- |
| Proyectos | Cliente | Clientes |
| Tareas | Proyecto | Proyectos |
| Tareas | Hito relacionado | Hitos |
| Actividad | Proyecto | Proyectos |
| Preguntas | Proyecto | Proyectos |
| Hitos | Proyecto | Proyectos |
| Archivos | Proyecto | Proyectos |

Incluí un script idempotente para crearlos cuando haya autorización para modificar el esquema:

```bash
node scripts/ensure-airtable-links.mjs
```

El script primero lee el schema y salta campos que ya existan.
