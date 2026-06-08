# Cambios y Mejoras al Rol de Servicio

Este documento registrará de manera detallada todas las mejoras, cambios y decisiones de diseño relacionadas con el rol de **Servicio** en la aplicación.

## Historial de Cambios

### 1. Mejoras en UI y Filtros (Inventario)
- **Corrección de Permisos de Categorías:** El rol de "Servicio" (y otros que ven el inventario) ahora tienen permisos explícitos para obtener el listado de categorías (`ACCIONES.CATEGORIAS_VER`). Antes esto fallaba de forma silenciosa e impedía que las categorías creadas se mostraran en el filtro.
- **Punto Verde de Filtros:** Se corrigió la lógica para que el indicador (punto verde) en el botón de "Filtros" solo aparezca cuando el rol de Servicio activa un filtro manual adicional a su filtro por defecto ("ítems dañados").
- **Botón "Limpiar":** Se reemplazó el texto "Limpiar" por un icono minimalista de papelera (`Trash2` de Lucide React), añadiendo una animación suave (`hover:bg-red-50`), y cambiando el cursor a `cursor-pointer`.
- **Integración de Búsqueda en `SelectSearch`:** Se rediseñó el componente global de selección de búsqueda. Ahora, el campo de escritura está integrado directamente en el propio botón (estilo *ComboBox* nativo), mejorando significativamente la experiencia del usuario al escribir y filtrar categorías.
