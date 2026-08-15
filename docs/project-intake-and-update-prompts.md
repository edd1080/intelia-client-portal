# Prompts y plantillas oficiales para crear/actualizar proyectos Intelia

Usar estas plantillas para convertir información de cliente, reuniones o sesiones de trabajo en registros Airtable consistentes para el portal.

## 1) Prompt maestro: crear proyecto nuevo

```text
Actúa como Project Operations Lead de Intelia. Convierte la información siguiente en una carga inicial estructurada para el portal cliente Intelia.

Reglas:
- No inventes avances, fechas ni entregables.
- Si falta información crítica, marca "pendiente".
- Todo texto visible debe ser claro para cliente, no técnico interno.
- Separa tareas internas de tareas visibles al cliente.
- Si hay varios proyectos, crea una salida por proyecto.
- Incluye campos de Gantt solo cuando haya fechas razonables; si no, marca pendiente.

Entrada del proyecto:
[PEGAR AQUÍ BRIEF, PRD, PROPUESTA, MINUTA O CONTEXTO]

Devuelve en este formato:

CLIENTE
- Nombre:
- Contacto principal:
- Email contacto:
- Color de marca:

PROYECTO
- Nombre:
- Código:
- Estado general: en progreso | en riesgo | atrasado | pausado | completado
- Fase actual:
- Progreso %:
- Fecha de inicio:
- Fecha estimada de cierre:
- Resumen ejecutivo visible al cliente:
- Explicación del avance restante:
- Próximo hito:
- Fecha próximo hito:
- Semáforo cliente: tranquilo | atención | decisión requerida
- Mensaje para cliente:
- Métricas de impacto: Label | Valor | Nota

ACCESOS PORTAL
- Stakeholder:
- Email:
- Estado: activo
- Notas internas:

HITOS
- Nombre:
- Descripción cliente:
- Fecha estimada:
- Fecha real:
- Estado: alcanzado | actual | pendiente | en riesgo | bloqueado
- Criterio de aceptación:
- Orden Gantt:

TAREAS VISIBLES AL CLIENTE
- Nombre:
- Descripción cliente:
- Estado: por hacer | en progreso | en revisión | completado | bloqueado
- Prioridad: alta | media | baja
- Fecha estimada:
- Hito relacionado:
- Visible al cliente: sí
- Es actual: sí/no
- Necesita acción del cliente: sí/no
- Acción requerida:
- Fecha inicio Gantt:
- Fecha fin Gantt:
- Progreso Gantt %:
- Orden Gantt:
- Dependencias Gantt:

ACTIVIDAD INICIAL
- Título:
- Fecha:
- Tipo: avance | decisión | bloqueo | entrega | reunión | cambio de alcance
- Descripción en lenguaje plano:
- Qué significa para el cliente:
- Origen:
- Visible al cliente: sí/no

PREGUNTAS / DECISIONES
- Pregunta:
- Autor:
- Fecha:
- Estado: sin responder | respondido | requiere decisión
- Respuesta:
- Requiere decisión de cliente: sí/no

ARCHIVOS / ENTREGABLES
- Nombre:
- Categoría:
- URL o pendiente:
- Estado: disponible | pendiente | reemplazado
- Descripción:
- Visible al cliente: sí/no
```

## 2) Prompt maestro: actualizar proyecto existente

```text
Actúa como Project Operations Lead de Intelia. Convierte este update en cambios concretos para Airtable y el portal cliente.

Objetivo del update:
- Que el cliente entienda qué cambió, qué sigue, si hay riesgos y si debe tomar acción.
- No registrar ruido interno.
- No inventar porcentajes; si no hay evidencia, sugiere mantener el actual.

Proyecto existente:
Cliente:
Proyecto / Código:
Estado actual conocido:
Último update conocido:

Nueva información:
[PEGAR AQUÍ NOTAS DE SESIÓN, WHATSAPP, MINUTA, COMMIT SUMMARY, REPORTE O AVANCE]

Devuelve:

CAMBIOS A PROYECTOS
- Estado general nuevo:
- Fase actual nueva:
- Progreso % nuevo:
- Resumen ejecutivo actualizado:
- Explicación del avance restante:
- Próximo hito:
- Fecha próximo hito:
- Semáforo cliente:
- Mensaje para cliente:
- Actualizado por:
- Última actualización:
- Métricas de impacto nuevas/actualizadas:

ACTIVIDAD A CREAR
- Título:
- Fecha:
- Tipo:
- Descripción en lenguaje plano:
- Qué significa para el cliente:
- Origen:
- Visible al cliente:

TAREAS A ACTUALIZAR
- Nombre exacto o nueva tarea:
- Estado:
- Descripción cliente:
- Prioridad:
- Visible al cliente:
- Es actual:
- Necesita acción del cliente:
- Acción requerida:
- Fecha inicio Gantt:
- Fecha fin Gantt:
- Progreso Gantt %:
- Orden Gantt:

HITOS A ACTUALIZAR
- Nombre exacto o nuevo hito:
- Estado:
- Fecha estimada:
- Fecha real:
- Descripción cliente:
- Criterio de aceptación:
- Orden Gantt:

PREGUNTAS / DECISIONES
- Pregunta o decisión:
- Estado:
- Respuesta:
- Requiere decisión de cliente:

ARCHIVOS A PUBLICAR
- Nombre:
- Categoría:
- URL:
- Estado:
- Descripción:
- Visible al cliente:

RIESGOS
- Riesgo:
- Impacto visible:
- Mitigación:
- Necesita decisión del cliente:
```

## 3) Plantilla mínima para update rápido

```markdown
Cliente:
Proyecto / Código:
Fecha del update:
Estado general:
Fase actual:
Progreso %:

Resumen ejecutivo visible:

Qué cambió:
- 

Qué sigue:
- 

Necesitamos algo del cliente:
- Sí/No:
- Acción requerida:

Riesgos o bloqueos:
- 

Tareas que cambiaron:
- Tarea | Estado | Fecha estimada | Visible cliente | Gantt inicio | Gantt fin | Gantt %

Hitos que cambiaron:
- Hito | Estado | Fecha estimada | Criterio de aceptación

Archivos/entregables:
- Nombre | URL/pendiente | Estado | Descripción
```

## 4) Criterio de calidad antes de cargar a Airtable

Antes de cargar un update, debe responder:

- ¿El cliente entiende el estado en 10 segundos?
- ¿Sabe qué sigue y cuándo?
- ¿Sabe si Intelia necesita algo de él?
- ¿Hay evidencia visible: tareas, hito, archivo, métrica o actividad?
- ¿Si hay riesgo, hay mitigación clara?
- ¿El Gantt tiene fechas inicio/fin coherentes en tareas visibles?
