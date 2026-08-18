# Documento oficial — Prompts para agentes de desarrollo → Hermes/Airtable

Estos prompts son para usarlos con Claude Code, OpenCode, Codex u otro agente dentro del repositorio donde se esté desarrollando un proyecto de Intelia.

Objetivo: que el agente revise el contexto real del proyecto y devuelva un bloque estándar que Hermes pueda consumir después para crear o actualizar registros en Airtable y publicar snapshots del portal cliente.

Este es el documento oficial para prompts de agentes externos. Mantener aquí tanto el prompt de **creación** como el de **actualización**; no crear documentos paralelos de updates para evitar duplicados.

## Cómo usarlos

1. Abrir el agente dentro del repo/proyecto correcto.
2. Pegar uno de estos prompts.
3. Si es creación inicial, usar **Prompt 1**.
4. Si es fin de sesión/update diario/semanal, usar **Prompt 2**.
5. Copiar la respuesta completa del agente.
6. Pegarla a Hermes diciendo: `Actualiza Airtable con este handoff:`.

Reglas importantes para el agente:

- Debe inspeccionar archivos reales, issues, docs, commits, TODOs y estado del repo si tiene acceso.
- No debe inventar fechas, porcentajes, stakeholders ni entregables.
- Debe separar hallazgos verificados de supuestos.
- Debe escribir para cliente, no para ingenieros internos.
- Debe devolver **solo el bloque oficial**, sin explicación adicional antes o después.

---

## Prompt 1 — Crear proyecto nuevo desde un repo/contexto de desarrollo

Usar cuando un proyecto todavía no existe o necesita una carga inicial seria para Airtable.

```text
Necesito que prepares un handoff oficial para crear este proyecto en el Portal Cliente de Intelia.

Actúa como Technical Project Analyst para Intelia. Revisa todo el contexto disponible de este proyecto en este entorno: README, docs, PRD, requirements, issues, commits recientes, branch actual, código fuente, configuración, tareas pendientes, tests, scripts, mensajes relevantes y cualquier archivo de planeación disponible.

Tu objetivo NO es modificar código. Tu objetivo es devolver un bloque estructurado que Hermes pueda consumir después para crear/actualizar Airtable y alimentar el dashboard cliente.

Reglas estrictas:
- No inventes datos. Si algo no está claro, escribe "pendiente".
- Distingue entre información verificada y supuestos.
- Escribe en español claro, ejecutivo y apto para cliente.
- No incluyas secretos, API keys, tokens, passwords, connection strings ni URLs privadas con credenciales.
- No incluyas detalles técnicos internos innecesarios para cliente.
- Si hay tareas internas, solo inclúyelas si afectan visiblemente el avance del cliente.
- Si detectas fechas reales o estimadas, úsalas. Si no, marca "pendiente".
- Si detectas progreso, explica la evidencia. Si no hay evidencia suficiente, marca progreso como "pendiente" o sugiere 0%.
- Devuelve únicamente el bloque entre `INTELIA_PROJECT_HANDOFF_START` y `INTELIA_PROJECT_HANDOFF_END`.

Antes de responder, inspecciona:
- Nombre y propósito del proyecto.
- Cliente relacionado.
- Estado actual del desarrollo.
- Funcionalidades existentes.
- Funcionalidades pendientes.
- Riesgos o bloqueos.
- Entregables o demos disponibles.
- Próximos hitos razonables.
- Evidencia verificable: archivos, módulos, tests, commits, rutas, endpoints, screenshots o docs.
- Fechas útiles para un Gantt si existen.
- Roadmap completo por fases: fase actual, fases terminadas, fases pendientes, dependencias, entregables, criterios de aceptación, riesgos por fase y fechas estimadas. El portal necesita más que 2-3 hitos genéricos.

Formato obligatorio de respuesta:

INTELIA_PROJECT_HANDOFF_START
TIPO_DE_HANDOFF: CREACION_PROYECTO
FECHA_DE_ANALISIS: [YYYY-MM-DD]
AGENTE_ORIGEN: [Claude Code | OpenCode | Codex | Otro]
REPO_O_CONTEXTO: [nombre/ruta/repo si está disponible]
BRANCH_O_VERSION: [branch, commit corto o pendiente]

CLIENTE
- Nombre:
- Unidad/país:
- Contacto principal:
- Emails de stakeholders conocidos:
- Notas de acceso:

PROYECTO
- Nombre oficial recomendado:
- Código corto recomendado:
- Estado general recomendado: [en progreso | en riesgo | atrasado | pausado | completado | pendiente]
- Fase actual:
- Progreso % recomendado:
- Evidencia para el progreso:
- Fecha de inicio:
- Fecha estimada de cierre:
- Resumen ejecutivo visible al cliente:
- Explicación del avance restante:
- Próximo hito:
- Fecha próximo hito:
- Semáforo cliente: [tranquilo | atención | decisión requerida]
- Mensaje para cliente:

ALCANCE FUNCIONAL VERIFICADO
- Funcionalidad:
  - Estado: [existente | parcial | pendiente | bloqueada]
  - Evidencia:
  - Valor para cliente:

HITOS PROPUESTOS
- Nombre:
  - Estado: [alcanzado | actual | pendiente | en riesgo | bloqueado]
  - Fecha estimada:
  - Fecha real:
  - Descripción cliente:
  - Criterio de aceptación:
  - Orden Gantt:

ROADMAP_COMPLETO_PARA_PORTAL
- Fase:
  - Estado: [alcanzada | actual | pendiente | en riesgo | bloqueada]
  - Objetivo cliente:
  - Entregables visibles:
  - Tareas clave incluidas:
  - Dependencias:
  - Riesgos/bloqueos de la fase:
  - Criterio de aceptación:
  - Fecha inicio estimada:
  - Fecha cierre estimada:
  - Evidencia:

TAREAS VISIBLES AL CLIENTE
- Nombre:
  - Estado: [por hacer | en progreso | en revisión | completado | bloqueado]
  - Prioridad: [alta | media | baja]
  - Fecha estimada:
  - Hito relacionado:
  - Descripción cliente:
  - Visible al cliente: sí
  - Es actual: sí/no
  - Necesita acción del cliente: sí/no
  - Acción requerida:
  - Fecha inicio Gantt:
  - Fecha fin Gantt:
  - Progreso Gantt %:
  - Orden Gantt:
  - Dependencias Gantt:
  - Evidencia:

ACTIVIDAD INICIAL RECOMENDADA
- Título:
  - Fecha:
  - Tipo: [avance | decisión | bloqueo | entrega | reunión | cambio de alcance]
  - Descripción en lenguaje plano:
  - Qué significa para el cliente:
  - Origen/evidencia:
  - Visible al cliente: sí/no

PREGUNTAS / DECISIONES PENDIENTES
- Pregunta o decisión:
  - Estado: [sin responder | respondido | requiere decisión]
  - Contexto:
  - Requiere decisión de cliente: sí/no
  - Impacto si no se responde:

ARCHIVOS / ENTREGABLES DETECTADOS
- Nombre:
  - Categoría:
  - URL o ruta de referencia:
  - Estado: [disponible | pendiente | reemplazado]
  - Descripción cliente:
  - Visible al cliente: sí/no

MÉTRICAS DE IMPACTO
- Métrica:
  - Valor actual:
  - Meta o interpretación:
  - Evidencia:

RIESGOS Y BLOQUEOS
- Riesgo/bloqueo:
  - Impacto visible para cliente:
  - Mitigación recomendada:
  - Necesita decisión del cliente: sí/no

SUPUESTOS / DATOS PENDIENTES
- Dato pendiente:
  - Por qué importa:
  - Quién debería confirmarlo:

NOTAS PARA HERMES
- Qué registros debería crear primero:
- Qué registros requieren revisión humana antes de publicar:
- Qué NO debería publicar al cliente:
INTELIA_PROJECT_HANDOFF_END
```

---

## Prompt 2 — Generar update de proyecto después de una sesión de desarrollo

Usar al terminar una sesión de Claude Code/OpenCode/Codex, o cuando quieras que el agente resuma avances recientes para Airtable.

```text
Necesito que prepares un handoff oficial de actualización para el Portal Cliente de Intelia.

Actúa como Technical Project Analyst para Intelia. Revisa lo ocurrido en esta sesión y el estado actual del repo/proyecto: cambios realizados, archivos modificados, commits, tests, bugs encontrados, decisiones tomadas, pendientes, blockers, tareas completadas, tareas nuevas y cualquier evidencia verificable.

Tu objetivo NO es seguir desarrollando. Tu objetivo es devolver un bloque estructurado que Hermes pueda consumir después para actualizar Airtable y el dashboard cliente.

Reglas estrictas:
- No inventes avances, fechas, porcentajes ni entregables.
- Si el avance no está verificado por código, test, commit, archivo, screenshot, demo o decisión documentada, márcalo como pendiente/no verificado.
- Escribe en español claro y apto para cliente.
- No reveles secretos, tokens, API keys, passwords, connection strings ni detalles internos sensibles.
- No incluyas logs enormes ni diffs completos.
- Convierte detalles técnicos a impacto de negocio/cliente.
- Distingue entre "hecho", "en progreso", "bloqueado" y "pendiente de validar".
- Devuelve únicamente el bloque entre `INTELIA_PROJECT_UPDATE_START` y `INTELIA_PROJECT_UPDATE_END`.

Antes de responder, inspecciona:
- Git status/diff/commits recientes si están disponibles.
- Tests/build/lint ejecutados y resultado real.
- Archivos o módulos modificados.
- Funcionalidad completada o parcialmente completada.
- Riesgos técnicos que afectan fecha, alcance o calidad.
- Decisiones pendientes del cliente o del equipo Intelia.
- Entregables visibles que se puedan compartir.
- Fechas útiles para actualizar Gantt.
- Roadmap completo actualizado: no respondas solo con 2-3 hitos. Incluye fases suficientes para que el portal muestre un roadmap robusto: entregables, dependencias, criterios de aceptación, riesgos por fase y fechas.

Formato obligatorio de respuesta:

INTELIA_PROJECT_UPDATE_START
TIPO_DE_HANDOFF: ACTUALIZACION_PROYECTO
FECHA_DEL_UPDATE: [YYYY-MM-DD]
AGENTE_ORIGEN: [Claude Code | OpenCode | Codex | Otro]
REPO_O_CONTEXTO: [nombre/ruta/repo si está disponible]
BRANCH_O_VERSION: [branch, commit corto o pendiente]

IDENTIFICACION_DEL_PROYECTO
- Cliente:
- Proyecto:
- Código del proyecto si existe:
- Stakeholders relacionados si aparecen:

RESUMEN_EJECUTIVO_CLIENTE
- Estado general recomendado: [en progreso | en riesgo | atrasado | pausado | completado | sin cambio]
- Fase actual recomendada:
- Progreso % recomendado:
- ¿Cambiar porcentaje?: sí/no
- Evidencia para cambiar o mantener porcentaje:
- Mensaje breve para cliente:
- Explicación del avance restante:
- Próximo hito:
- Fecha próximo hito:
- Semáforo cliente: [tranquilo | atención | decisión requerida]

QUE_CAMBIO_DESDE_EL_UPDATE_ANTERIOR
- Cambio:
  - Tipo: [avance | fix | entrega | decisión | bloqueo | cambio de alcance | investigación]
  - Descripción para cliente:
  - Impacto para cliente:
  - Evidencia:
  - Visible al cliente: sí/no

ACTIVIDAD_A_CREAR_EN_AIRTABLE
- Título:
  - Fecha:
  - Tipo: [avance | decisión | bloqueo | entrega | reunión | cambio de alcance]
  - Descripción en lenguaje plano:
  - Qué significa para el cliente:
  - Origen/evidencia:
  - Visible al cliente: sí/no

TAREAS_A_ACTUALIZAR_O_CREAR
- Nombre exacto o nueva tarea:
  - Acción: [crear | actualizar | cerrar | no tocar]
  - Estado: [por hacer | en progreso | en revisión | completado | bloqueado]
  - Prioridad: [alta | media | baja]
  - Fecha estimada:
  - Hito relacionado:
  - Descripción cliente:
  - Visible al cliente: sí/no
  - Es actual: sí/no
  - Necesita acción del cliente: sí/no
  - Acción requerida:
  - Fecha inicio Gantt:
  - Fecha fin Gantt:
  - Progreso Gantt %:
  - Orden Gantt:
  - Dependencias Gantt:
  - Evidencia:

HITOS_A_ACTUALIZAR_O_CREAR
- Nombre exacto o nuevo hito:
  - Acción: [crear | actualizar | cerrar | no tocar]
  - Estado: [alcanzado | actual | pendiente | en riesgo | bloqueado]
  - Fecha estimada:
  - Fecha real:
  - Descripción cliente:
  - Criterio de aceptación:
  - Orden Gantt:
  - Evidencia:

ROADMAP_COMPLETO_A_ACTUALIZAR
- Fase exacta o nueva fase:
  - Acción: [crear | actualizar | cerrar | no tocar]
  - Estado: [alcanzada | actual | pendiente | en riesgo | bloqueada]
  - Objetivo cliente:
  - Entregables visibles:
  - Tareas clave incluidas:
  - Dependencias:
  - Riesgos/bloqueos de la fase:
  - Criterio de aceptación:
  - Fecha inicio estimada:
  - Fecha cierre estimada:
  - Evidencia:

PREGUNTAS_DECISIONES_O_BLOQUEOS
- Pregunta/decisión/bloqueo:
  - Estado: [sin responder | respondido | requiere decisión | bloqueado]
  - Contexto cliente:
  - Respuesta si ya existe:
  - Requiere decisión de cliente: sí/no
  - Acción requerida:
  - Impacto si no se resuelve:

ARCHIVOS_O_ENTREGABLES_A_PUBLICAR
- Nombre:
  - Categoría:
  - URL o ruta de referencia:
  - Estado: [disponible | pendiente | reemplazado]
  - Descripción cliente:
  - Visible al cliente: sí/no

TESTS_VALIDACION_EVIDENCIA
- Validación ejecutada:
  - Resultado: [pasó | falló | no ejecutado]
  - Evidencia breve:
  - Impacto para cliente:

RIESGOS_NUEVOS_O_ACTUALIZADOS
- Riesgo:
  - Impacto visible para cliente:
  - Probabilidad: [baja | media | alta]
  - Mitigación:
  - Necesita decisión del cliente: sí/no

NO_PUBLICAR_AL_CLIENTE
- Información sensible/interna que Hermes debe omitir:

NOTAS_PARA_HERMES
- Registros Airtable que debería crear:
- Registros Airtable que debería actualizar:
- Registros que requieren confirmación humana antes de publicar:
- Si falta contexto, qué debería preguntar Hermes al usuario:
INTELIA_PROJECT_UPDATE_END
```

---

## Prompt corto para pegarlo al final de una sesión

Si el agente ya conoce todo el contexto y solo querés pedirle el cierre rápido:

```text
Cierra esta sesión generando el bloque `INTELIA_PROJECT_UPDATE_START` / `INTELIA_PROJECT_UPDATE_END` para el Portal Cliente Intelia.

Actúa como Technical Project Analyst para Intelia. Revisa lo trabajado hoy y el estado real del repo/proyecto: cambios realizados, archivos modificados, commits, tests/build/lint ejecutados, bugs encontrados, entregables, pendientes, riesgos, decisiones del cliente, tareas visibles, Gantt y roadmap.

Reglas estrictas:
- No sigas desarrollando; solo genera el handoff.
- No inventes avances, fechas, porcentajes, entregables ni decisiones.
- Si algo no está verificado por código, test, commit, archivo, screenshot, demo o decisión documentada, marca `pendiente` o `no verificado`.
- Escribe en español claro, ejecutivo y apto para cliente.
- No incluyas secretos, tokens, API keys, passwords, connection strings ni detalles internos sensibles.
- Convierte detalles técnicos a impacto de negocio/cliente.
- Incluye un roadmap completo; no respondas solo con 2–3 hitos genéricos.
- Devuelve únicamente el bloque oficial, sin explicación adicional.
```
