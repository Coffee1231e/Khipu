# Khipu - Arquitectura y Guía de Desarrollo

Este documento define la estructura, tecnologías y reglas de codificación del proyecto **Khipu** (Sistema de gestión de activos institucionales SENA CIC). Sirve como fuente de verdad para mantener la consistencia en el desarrollo.

## 🛠 Stack Tecnológico

### Backend
- **Entorno:** Node.js + TypeScript
- **Framework:** Express v5
- **ORM / Base de Datos:** Prisma v7 + PostgreSQL
- **Validación:** Zod v4
- **Autenticación:** JWT (JSON Web Tokens) en Cookies + 2FA (TOTP con `otpauth`)
- **Almacenamiento:** Supabase Storage (Manejo de imágenes)
- **Monitoreo:** Sentry
- **Gestor de paquetes:** pnpm

### Frontend
- **Framework:** React 19 + Vite + TypeScript
- **Enrutamiento:** React Router v7 (Lazy loading)
- **Estilos:** Tailwind CSS v4 + UI personalizada (sin librerías como MUI o Chakra)
- **Iconos:** Lucide React
- **Peticiones HTTP:** Axios + Custom Hook (`useFetch`) o `@tanstack/react-query`

---

## 🏗 Estructura del Proyecto

El proyecto se divide en dos carpetas principales: `/frontend` y `/backend`.

### Backend (Arquitectura en Capas)
Usa un enfoque basado en capas de responsabilidad para separar la lógica de negocio, las integraciones externas y el manejo de HTTP.

- `src/infrastructure/`: Contiene los servicios que interactúan con el exterior (Base de datos, Envío de correos, JWT, Tiempo real/Notificaciones, Almacenamiento en Supabase).
- `src/interface/`: Contiene la capa HTTP. Controladores (`controllers/`), Middlewares (`middleware/`), Rutas (`routes/`) y Validadores de esquemas (`validators/schemas.ts`).
- `src/shared/`: Utilidades comunes. Configuración fuertemente tipada de variables de entorno (`config/env.ts`), manejador de errores unificado (`errors/AppError.ts`) y logger estructurado.

### Frontend (Feature-Sliced Design)
Usa una arquitectura orientada a características (*features*) para mantener el código altamente cohesivo y modular.

- `src/features/`: Agrupa el código por dominio de negocio (ej. `bodega`, `inventario`, `auth`, `mantenimiento`). Cada feature contiene sus propias `pages`, `components`, `context` y `utils`.
- `src/shared/`: Código reutilizable globalmente. Componentes de UI comunes (`components/ui`), Layouts, Hooks (`useFetch.ts`), y tipados globales (`types/index.ts`).
- `src/lib/`: Configuración de librerías de terceros (ej. cliente `axios` en `api.ts`, inicialización de Supabase).
- `src/pages/`: Páginas globales de la aplicación (ej. `LoginPage`, `DashboardPage`, `NotFoundPage`).

---

## 📜 Reglas de Codificación y Convenciones

Para mantener la calidad y evitar regresiones, sigue estas reglas al modificar o añadir código:

### 1. Variables de Entorno y Configuración
- **Nunca uses `process.env` directamente** dentro del código de la aplicación. Toda variable de entorno debe definirse, validarse e inferirse usando Zod en `backend/src/shared/config/env.ts`. 
- La única excepción es en los archivos de configuración externos a la compilación principal, pero siempre prefiriendo importar el objeto `env` validado si es posible.

### 2. Express v5 y Validaciones (Backend)
- Khipu usa **Express v5**, el cual trae cambios importantes. Por ejemplo, `req.query` es un objeto de solo lectura (`readonly`).
- Las validaciones deben hacerse **exclusivamente con Zod** en la capa de middlewares usando el `validate.middleware.ts`. 
- Si se requiere sobreescribir la *query* con los datos limpiados por Zod, usa aserción de tipos (`(req as any)[target] = result.data`) para saltar la restricción readonly en lugar de la mutación `Object.assign`.

### 3. Tailwind CSS v4 (Frontend)
- Tailwind v4 **no utiliza el archivo `tailwind.config.js`**.
- Las variables de tema, colores institucionales (SENA, Forest) y animaciones deben configurarse usando directivas CSS nativas dentro del bloque `@theme` en `frontend/src/index.css`.
- Al escribir CSS propio, se prefiere siempre el uso estándar. Si se añaden prefijos webkit (ej. `-webkit-line-clamp`), siempre añade la propiedad estandarizada (`line-clamp`) a continuación para evitar advertencias de los linters.

### 4. Tipado Estricto y Estado Compartido
- **Interfaces Centralizadas:** El archivo `frontend/src/shared/types/index.ts` es la fuente de verdad del tipado en el cliente. Mantenlo sincronizado con las respuestas del backend.
- Siempre verifica la existencia de datos antes de mapear (`array?.map` o fallback `?? []`) para evitar crasheos del cliente.
- En los Contextos (ej. `AuthContext`, `NotificacionesContext`), asegúrate de declarar adecuadamente los arrays de dependencias en `useEffect` o usa `useCallback` para las funciones expuestas como valores del contexto.

### 5. Configuración de TypeScript
- Mantén activadas las verificaciones de tipos estrictas (`strict: true`).
- En el backend, el `tsconfig.json` principal (`rootDir: "./src"`) debe enfocarse exclusivamente en el código fuente. Los scripts de herramientas o configuraciones de raíz (como `prisma.config.ts`) se gestionan mediante configuraciones secundarias (ej. `tsconfig.node.json`) que no emiten archivos compilados (`noEmit: true`), protegiendo así el proceso de build.
