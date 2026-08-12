# Protocolo de uso de IA y trazabilidad

## Regla central

La IA acelera tareas bajo una condición: cada equipo conserva la obligación de comprender el grano, ejecutar la consulta, reconciliar resultados y responder por la conclusión.

## Usos admitidos

- reformular una pregunta de negocio;
- pedir una explicación de SQL o Python;
- producir un primer borrador de consulta;
- generar casos de prueba;
- detectar ambigüedades en una métrica;
- criticar un gráfico o una narrativa;
- mejorar claridad de documentación;
- proponer alternativas y trade-offs.

## Usos no admitidos

- presentar una salida no ejecutada como evidencia;
- copiar una explicación que el equipo no puede defender;
- cargar datos reales, personales, confidenciales o cubiertos por NDA sin autorización;
- inventar fuentes, valores o resultados;
- ocultar una intervención sustantiva de IA;
- delegar a la IA la calificación de personas o decisiones sensibles;
- usar credenciales o herramientas con permiso de escritura durante una demostración no controlada.

## Ciclo de verificación

1. **Intención:** registrar qué se pidió y para qué.
2. **Entrada:** revisar que no haya información sensible.
3. **Ejecución:** probar la consulta o el código sobre el release correcto.
4. **Reconciliación:** contrastar filas, totales, casos límite y definiciones.
5. **Interpretación:** separar resultado, hipótesis, limitación y decisión.

## Registro mínimo

Para una intervención relevante:

| Campo | Ejemplo |
|---|---|
| Tarea | Proponer SQL para OTIF por región |
| Herramienta | asistente generativo |
| Aporte | borrador de consulta y explicación |
| Verificación | conteos, denominador y comparación manual |
| Corrección | se cambió el grano de despacho a pedido |
| Responsable | integrante que revisó |

El registro excluye correcciones ortográficas menores.

## Auditoría de una respuesta

Preguntas obligatorias:

- ¿Qué tabla y qué fila representa el resultado?
- ¿La consulta usa el denominador correcto?
- ¿Un join puede duplicar importes?
- ¿Qué sucede con `NULL`?
- ¿La fecha es de pedido, despacho o entrega?
- ¿El resultado demuestra causalidad o solo asociación?
- ¿Qué dato faltante podría cambiar la conclusión?
- ¿Puede otra persona reproducirlo?

## MCP

MCP se presenta como un protocolo cliente–servidor mediante el cual una aplicación de IA descubre herramientas, recursos y prompts. En la materia se reconoce su función y se demuestra en modo de solo lectura; no se construye un servidor. Referencia: <https://modelcontextprotocol.io/docs/learn/architecture>.
