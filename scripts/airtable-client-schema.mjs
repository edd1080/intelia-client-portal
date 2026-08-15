export const WORKSPACE_ID = 'wspY7RqbxFvCYt5qJ';
export const MASTER_BASE_ID = 'appw3DgL0Piib7MZP';
export const MASTER_CLIENTS_TABLE_ID = 'tbl4Pwxo7jNpDxYXf';

export const DATE_OPTIONS = { dateFormat: { name: 'iso', format: 'YYYY-MM-DD' } };

export const CLIENTS_TO_CREATE = [
  { clientName: 'BIA Corporativo Guatemala', baseName: 'Intelia · BIA Corporativo Guatemala', notes: 'Cliente con varios proyectos: TalentHub, DataHub, Portal Vacaciones, Portal Beneficios.' },
  { clientName: 'BIA Honduras', baseName: 'Intelia · BIA Honduras', notes: 'Cliente con proyectos de implementación de AI para Marketing y Compras.' },
];

export const BASE_TABLES = [
  {
    name: 'Clientes',
    description: 'Metadata de branding y contacto para el cliente dueño de esta base.',
    fields: [
      { name: 'Nombre', type: 'singleLineText' },
      { name: 'Logo', type: 'url' },
      { name: 'Color de marca', type: 'singleLineText' },
      { name: 'Contacto principal', type: 'singleLineText' },
      { name: 'Email contacto', type: 'email' },
      { name: 'Estado', type: 'singleSelect', options: { choices: [{ name: 'Activo' }, { name: 'Inactivo' }] } },
    ],
  },
  {
    name: 'Proyectos',
    description: 'Un registro por proyecto de cliente. El acceso público se resuelve preferentemente desde Accesos Portal.',
    fields: [
      { name: 'Nombre', type: 'singleLineText' },
      { name: 'Código', type: 'singleLineText' },
      { name: 'Token de acceso', type: 'singleLineText' },
      { name: 'Estado general', type: 'singleSelect', options: { choices: [{ name: 'en curso' }, { name: 'en riesgo' }, { name: 'atrasado' }, { name: 'completado' }, { name: 'pausado' }] } },
      { name: 'Fecha de inicio', type: 'date', options: DATE_OPTIONS },
      { name: 'Fecha estimada de cierre', type: 'date', options: DATE_OPTIONS },
      { name: 'Resumen ejecutivo', type: 'multilineText' },
      { name: 'Próximo hito', type: 'singleLineText' },
      { name: 'Fecha próximo hito', type: 'date', options: DATE_OPTIONS },
      { name: 'Secciones habilitadas', type: 'multipleSelects', options: { choices: [{ name: 'kanban' }, { name: 'hitos' }, { name: 'actividad' }, { name: 'preguntas' }, { name: 'archivos' }, { name: 'metricas' }] } },
      { name: 'Métricas de impacto', type: 'multilineText' },
      { name: 'Última actualización', type: 'date', options: DATE_OPTIONS },
    ],
  },
  {
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
  },
  {
    name: 'Tareas',
    description: 'Todas las tareas del proyecto; Visible al cliente controla cuáles son publicables.',
    fields: [
      { name: 'Nombre', type: 'singleLineText' },
      { name: 'Estado', type: 'singleSelect', options: { choices: [{ name: 'por hacer' }, { name: 'en progreso' }, { name: 'en revisión' }, { name: 'completado' }] } },
      { name: 'Fecha estimada', type: 'date', options: DATE_OPTIONS },
      { name: 'Visible al cliente', type: 'checkbox', options: { icon: 'check', color: 'greenBright' } },
      { name: 'Notas internas', type: 'multilineText' },
    ],
  },
  {
    name: 'Actividad',
    description: 'Feed de updates en lenguaje claro. El registro más reciente alimenta Última actualización.',
    fields: [
      { name: 'Nombre', type: 'singleLineText' },
      { name: 'Fecha', type: 'date', options: DATE_OPTIONS },
      { name: 'Tipo', type: 'singleSelect', options: { choices: [{ name: 'nota' }, { name: 'tarea completada' }, { name: 'hito alcanzado' }, { name: 'cambio de estado' }] } },
      { name: 'Descripción', type: 'multilineText' },
      { name: 'Origen', type: 'singleSelect', options: { choices: [{ name: 'hermes' }, { name: 'claude' }, { name: 'claude-mcp' }, { name: 'panel admin' }, { name: 'sesión' }, { name: 'cliente' }] } },
    ],
  },
  {
    name: 'Preguntas',
    description: 'Preguntas del cliente y respuestas de Intelia.',
    fields: [
      { name: 'Mensaje', type: 'multilineText' },
      { name: 'Autor', type: 'singleSelect', options: { choices: [{ name: 'cliente' }, { name: 'lead' }] } },
      { name: 'Fecha', type: 'date', options: DATE_OPTIONS },
      { name: 'Estado', type: 'singleSelect', options: { choices: [{ name: 'sin responder' }, { name: 'respondido' }] } },
      { name: 'Respuesta', type: 'multilineText' },
      { name: 'Fecha de respuesta', type: 'date', options: DATE_OPTIONS },
    ],
  },
  {
    name: 'Hitos',
    description: 'Timeline de hitos principales del proyecto.',
    fields: [
      { name: 'Nombre', type: 'singleLineText' },
      { name: 'Fecha estimada', type: 'date', options: DATE_OPTIONS },
      { name: 'Fecha real', type: 'date', options: DATE_OPTIONS },
      { name: 'Estado', type: 'singleSelect', options: { choices: [{ name: 'pendiente' }, { name: 'alcanzado' }, { name: 'retrasado' }] } },
    ],
  },
  {
    name: 'Archivos',
    description: 'Entregables publicados al cliente.',
    fields: [
      { name: 'Nombre', type: 'singleLineText' },
      { name: 'URL', type: 'url' },
      { name: 'Fecha', type: 'date', options: DATE_OPTIONS },
      { name: 'Categoría', type: 'singleSelect', options: { choices: [{ name: 'Definición' }, { name: 'Entregable' }, { name: 'Documento' }, { name: 'Diseño' }, { name: 'Reporte' }] } },
    ],
  },
];

export const LINK_FIELDS = [
  { table: 'Proyectos', name: 'Cliente', linkedTable: 'Clientes' },
  { table: 'Accesos Portal', name: 'Proyecto', linkedTable: 'Proyectos' },
  { table: 'Tareas', name: 'Proyecto', linkedTable: 'Proyectos' },
  { table: 'Tareas', name: 'Hito relacionado', linkedTable: 'Hitos' },
  { table: 'Actividad', name: 'Proyecto', linkedTable: 'Proyectos' },
  { table: 'Preguntas', name: 'Proyecto', linkedTable: 'Proyectos' },
  { table: 'Hitos', name: 'Proyecto', linkedTable: 'Proyectos' },
  { table: 'Archivos', name: 'Proyecto', linkedTable: 'Proyectos' },
];
