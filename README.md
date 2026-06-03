# Khipu v2.0 — Sistema de Inventario SENA CIC

Sistema de gestión y control de activos institucionales para el SENA Centro de Industria y Construcción, Ibagué, Tolima.

---

## Tabla de contenidos

1. [Requisitos](#requisitos)
2. [Estructura del proyecto](#estructura)
3. [Configuración inicial](#configuración-inicial)
4. [Base de datos](#base-de-datos)
5. [Desarrollo local](#desarrollo-local)
6. [Despliegue en producción](#despliegue)
7. [Script de reset de BD](#script-reset)
8. [Roles y permisos](#roles)
9. [Variables de entorno](#variables-de-entorno)

---

## Requisitos

- **Node.js** v20 o superior
- **pnpm** v9 (`npm install -g pnpm`)
- Cuenta en **Supabase** (gratuita)
- Cuenta en **Railway** (gratuita, para el backend)
- Cuenta en **Vercel** (gratuita, para el frontend)

---

## Estructura

```
khipu/
├── backend/          Node.js + Express + TypeScript + Prisma
├── frontend/         React 18 + Vite + TypeScript + Tailwind v4
└── scripts/          Scripts de utilidad (solo desarrollo)
```

---

## Configuración inicial

### 1. Clonar y instalar dependencias

```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

### 2. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. En **Settings → Database**, copia las URLs de conexión:
   - **Connection string (Transaction mode)** → `DATABASE_URL`
   - **Connection string (Session mode / Direct)** → `DIRECT_URL`
3. En **Settings → API**, copia:
   - `URL` → `SUPABASE_URL`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY` (para el frontend)
4. En **Storage**, crea un bucket llamado `item-images` y márcalo como **público**.
5. En **Settings → Realtime**, asegúrate de que la tabla `notificaciones` tenga Realtime activado:
   ```sql
   -- Ejecutar en el SQL Editor de Supabase
   ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
   ```

### 3. Configurar variables de entorno

```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores reales

# Frontend
cp frontend/.env.example frontend/.env
# Editar frontend/.env con tus valores reales
```

**`frontend/.env`:**
```env
VITE_API_URL=http://localhost:4000
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Base de datos

### Generar el cliente de Prisma y aplicar migraciones

```bash
cd backend

# 1. Generar el cliente Prisma
pnpm prisma:generate

# 2. Aplicar migraciones (crea todas las tablas)
pnpm prisma:migrate

# 3. (Solo la primera vez) Poblar con datos iniciales
pnpm db:seed
```

Esto crea automáticamente:
- 8 categorías de ítems
- 2 naves y 3 ambientes de ejemplo
- 3 cuentas de prueba (ver abajo)

**Cuentas creadas por el seed:**

| Email                       | Contraseña     | Rol          |
|-----------------------------|----------------|--------------|
| admin@sena.edu.co           | Admin2024!     | Administrador|
| bodega@sena.edu.co          | Almacen2024!   | Almacén      |
| coordinador@sena.edu.co     | Coord2024!     | Coordinador  |

> ⚠️ **Cambia estas contraseñas inmediatamente después del primer login.**

---

## Desarrollo local

```bash
# Terminal 1 — Backend (puerto 4000)
cd backend
pnpm dev

# Terminal 2 — Frontend (puerto 5173)
cd frontend
pnpm dev
```

El frontend hace proxy de `/api` hacia `http://localhost:4000` automáticamente.

Accede en: [http://localhost:5173](http://localhost:5173)

### Prisma Studio (explorador visual de la BD)

```bash
cd backend
pnpm prisma:studio
# Abre en http://localhost:5555
```

---

## Despliegue

### Backend → Railway

1. Ve a [railway.app](https://railway.app) y crea una cuenta.
2. **New Project → Deploy from GitHub repo** → selecciona tu repositorio.
3. Railway detecta el `package.json` automáticamente.
4. En **Settings → Build**:
   - **Root Directory:** `backend`
   - **Build Command:** `pnpm install && pnpm prisma:generate && pnpm build`
   - **Start Command:** `node dist/server.js`
5. En **Variables**, agrega todas las variables del archivo `backend/.env.example` con tus valores de producción.
6. En la variable `CORS_ORIGINS`, pon la URL de tu frontend en Vercel: `https://tu-app.vercel.app`
7. Railway te da una URL como `https://khipu-api.railway.app` — cópiala.

### Frontend → Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta.
2. **New Project → Import Git Repository** → selecciona tu repositorio.
3. En **Configure Project**:
   - **Root Directory:** `frontend`
   - **Build Command:** `pnpm build`
   - **Output Directory:** `dist`
4. En **Environment Variables**, agrega:
   ```
   VITE_API_URL=https://khipu-api.railway.app
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
5. Deploy. Vercel te da una URL como `https://khipu.vercel.app`.

### Actualizar CORS

Después del deploy, actualiza `CORS_ORIGINS` en Railway:
```
CORS_ORIGINS=https://khipu.vercel.app
```

---

## Script de reset de BD

> ⚠️ **SOLO PARA DESARROLLO. Elimina todos los datos.**

```bash
cd backend
pnpm db:reset
```

El script:
1. Espera 3 segundos (puedes cancelar con Ctrl+C).
2. Elimina **todos** los registros en orden correcto.
3. Corre el seed con datos iniciales.
4. Muestra las cuentas creadas.

**No puede ejecutarse si `NODE_ENV=production`.**

---

## Roles

| Rol             | Descripción                                        |
|----------------|-----------------------------------------------------|
| Administrador  | Acceso total. Gestiona usuarios, naves, ambientes. |
| Almacén        | Gestiona bodega, crea y asigna ítems, categorías.  |
| Coordinador    | Ve inventario y traslados de sus naves asignadas.  |
| Encargado      | Gestiona su ambiente, aprueba traslados.           |
| Instructor     | Hace verificaciones de inventario, solicita traslados (con aprobación). |
| Servicio       | Ve ítems dañados, gestiona mantenimiento.          |

### Acciones que requieren 2FA activo

- Administrador: crear/editar/desactivar usuarios, gestionar naves y ambientes
- Almacén: dar de baja ítems permanentemente
- Coordinador: aprobar traslados entre naves

---

## Variables de entorno

### Backend (`.env`)

| Variable                  | Descripción                                  | Requerida |
|---------------------------|----------------------------------------------|-----------|
| `PORT`                    | Puerto del servidor (default: 4000)          | No        |
| `NODE_ENV`                | `development` o `production`                 | Sí        |
| `DATABASE_URL`            | URL Supabase con pooling (pgbouncer)         | Sí        |
| `DIRECT_URL`              | URL Supabase directa (para migraciones)     | Sí        |
| `SUPABASE_URL`            | URL del proyecto Supabase                   | Sí        |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role de Supabase            | Sí        |
| `JWT_SECRET`              | Secreto para firmar JWTs (mín. 32 chars)    | Sí        |
| `JWT_EXPIRES_IN`          | Duración del token (default: 8h)            | No        |
| `CORS_ORIGINS`            | URLs permitidas separadas por coma          | Sí        |
| `EMAIL_USER`              | Gmail para envío de correos                 | No        |
| `EMAIL_PASS`              | App Password de Gmail                       | No        |
| `SENTRY_DSN`              | DSN de Sentry para monitoreo de errores     | No        |
| `SENTRY_ENABLED`          | `true` o `false`                            | No        |

### Frontend (`.env`)

| Variable               | Descripción                              |
|------------------------|------------------------------------------|
| `VITE_API_URL`         | URL del backend (Railway en producción) |
| `VITE_SUPABASE_URL`    | URL del proyecto Supabase               |
| `VITE_SUPABASE_ANON_KEY` | Clave anon pública de Supabase        |

---

## Tecnologías

**Backend:** Node.js · Express · TypeScript · Prisma · PostgreSQL (Supabase) · JWT · bcryptjs · Nodemailer · OTPAuth · Sharp · Winston · Zod · Sentry

**Frontend:** React 18 · Vite · TypeScript · Tailwind CSS v4 · React Router v6 · Axios · Supabase Realtime · React Hot Toast · Lucide React

---

## Soporte

Para problemas técnicos, revisar los logs de:
- **Railway:** Dashboard → Deployments → Logs
- **Vercel:** Dashboard → Functions → Logs  
- **Sentry:** Si está configurado, errores aparecen allí automáticamente

---

*Khipu v2.0 — SENA Centro de Industria y Construcción, Ibagué, Tolima.*
