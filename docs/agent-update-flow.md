# Flujo de actualización de proyectos Intelia

Este flujo sirve para pedirle a OpenCode, Claude Code, Codex u otro agente de desarrollo que cierre una sesión con datos estructurados para actualizar Airtable y el Portal Cliente.

## Flujo operativo

1. Abrir el agente en el repo/contexto del proyecto correcto.
2. Pegar el prompt de actualización de abajo.
3. El agente debe inspeccionar cambios reales, commits, archivos, tests, pendientes, riesgos, Gantt y roadmap.
4. El agente devuelve solo un bloque `INTELIA_PROJECT_UPDATE_START` / `INTELIA_PROJECT_UPDATE_END`.
5. Pegar ese bloque a Hermes con: `Actualiza el portal/Airtable con este handoff:`.
6. Hermes actualiza Airtable, corre `npm run portal:publish-snapshots`, valida `npm run build` y despliega.

## Prompt corto para cierre de sesión

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

## Prompt completo de actualización

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
- Roadmap completo actualizado: incluye fases suficientes para que el portal muestre un roadmap robusto: entregables, dependencias, criterios de aceptación, riesgos por fase y fechas.

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
