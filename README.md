# 🧠 GO Software - Plataforma Web Interactiva para Aprender y Jugar GO

Plataforma web escalable y profesional donde los usuarios pueden jugar partidas de GO contra un bot, recibir asistencia reflexiva en tiempo real, obtener informes personalizados y seguir su progreso.

---

## 🎯 Objetivo del Proyecto

Desarrollar una plataforma **educativa y entretenida** que combine juego, análisis y mejora continua a través de inteligencia artificial.

---

## 🧱 Funcionalidades Clave

- 🕹 Juego de GO contra un bot aleatorio.
- 🤖 Chatbot reflexivo que guía al jugador con preguntas, no jugadas.
- 📑 Informe post-partida con feedback generado por IA (OpenAI).
- 🧠 Ejercicios personalizados según errores cometidos.
- 📊 Dashboard de progreso con estadísticas, logros y evolución.
- 🔐 Login y autenticación con JWT.
- 🎯 Preparado para sistema de suscripciones y roles de usuario.

---

## 🧪 Tecnologías Utilizadas

### 📦 Backend
- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- JWT para autenticación
- Zod para validaciones
- Swagger para documentación de la API

### 🖥 Frontend
- React + Vite
- TailwindCSS
- Framer Motion
- Zustand (estado global)
- React Query (TanStack)

### 🤖 IA & Bot
- OpenAI GPT-4o (para informes)
- Motor lógico propio para GO
- Bot aleatorio (MVP)

### ☁ Infraestructura
- Docker

---

## 🗄️ Configurar la base de datos con Docker

Este proyecto incluye un contenedor Docker para levantar PostgreSQL fácilmente. Solo necesitás tener Docker instalado y correr:

```bash
docker-compose up -d
```

Esto va a crear un contenedor llamado `go_postgres` con:

- Usuario: `postgres`
- Contraseña: `postgres`
- Base de datos: `go_db`

Acceso local: `localhost:5432`

---

## 🔄 DATABASE_URL recomendada

En tu archivo `.env`, usá esta cadena de conexión:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/go_db
```

---

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/GO
cd GO
```

### 2. Levantar PostgreSQL

```bash
docker-compose up -d
```

### 3. Backend

```bash
cd backend
npm install

# Configurar variables
cp .env.example .env

# Ejecutar migraciones y levantar el servidor
npx prisma migrate dev
npm run start:dev
```

### 4. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

---

## 🛠 Variables de Entorno

Crear `.env` en la carpeta `backend/` con:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/go_db
JWT_SECRET=clave_super_secreta
OPENAI_API_KEY=tu_openai_key
```


