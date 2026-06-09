# Cambios y Mejoras al Rol de Servicio

Este documento registrará de manera detallada todas las mejoras, cambios y decisiones de diseño relacionadas con el rol de **Servicio** en la aplicación.

## Historial de Cambios

### 1. Mejoras en UI y Filtros (Inventario)
- **Corrección de Permisos de Categorías:** El rol de "Servicio" (y otros que ven el inventario) ahora tienen permisos explícitos para obtener el listado de categorías (`ACCIONES.CATEGORIAS_VER`). Antes esto fallaba de forma silenciosa e impedía que las categorías creadas se mostraran en el filtro.
- **Punto Verde de Filtros:** Se corrigió la lógica para que el indicador (punto verde) en el botón de "Filtros" solo aparezca cuando el rol de Servicio activa un filtro manual adicional a su filtro por defecto ("ítems dañados").
- **Botón "Limpiar":** Se reemplazó el texto "Limpiar" por un icono minimalista de papelera (`Trash2` de Lucide React), añadiendo una animación suave (`hover:bg-red-50`), y cambiando el cursor a `cursor-pointer`.
- **Integración de Búsqueda en `SelectSearch`:** Se rediseñó el componente global de selección de búsqueda. Ahora, el campo de escritura está integrado directamente en el propio botón (estilo *ComboBox* nativo), mejorando significativamente la experiencia del usuario al escribir y filtrar categorías. Adicionalmente, el icono de flecha (`▼`) funciona como un botón "toggle" que pliega o despliega la lista sin borrar el valor actualmente buscado o seleccionado.

### 2. Flujo de Notificaciones y Daños
- **Notificaciones en Barra Lateral:** Se añadió una nueva sección exclusiva de "Notificaciones" al final de la navegación principal para todos los roles, con un diseño que usa un badge (círculo) color verde claro (`bg-green-400`) para alertar sobre novedades sin ser visualmente invasivo (reemplazando el color rojo habitual de alerta).
- **Flujo de Reporte de Ítems Dañados:**
  - El rol "Instructor" realiza revisiones usando la función de Verificación y marca elementos como "dañados". Esto no afecta directamente el estado global del inventario, sino que se almacena en los detalles de la revisión.
  - El rol "Encargado" recibe una notificación alertando de dicha revisión y puede acceder a los detalles.
  - Al revisar los detalles, el "Encargado" visualiza un resumen (si existen ítems dañados reportados) con un botón para **"Confirmar y reportar daños"**.
  - Al confirmar, el sistema de manera global actualiza el estado de dichos ítems a `danado` para que aparezcan en el panel general.
  - Simultáneamente, el sistema compila una lista de estos ítems y dispara una **"Súper Notificación"** especial al rol de **Servicio**.
  - Esta notificación llega a Servicio como *"Se han reportado X ítems dañados en el ambiente Y por Z"*. En su propia bandeja de Notificaciones, Servicio puede desplegar un panel en forma de acordeón dentro de la alerta misma para leer la lista íntegra de ítems (Nombre y N° de Inventario) sin necesidad de re-navegar a otra página.
