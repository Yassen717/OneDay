# One Day ✨

A modern notes app with secure auth, AI-assisted note management, and a polished UI.

<p align="left">
  <a href="https://nextjs.org" target="_blank"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white"></a>
  <a href="https://react.dev" target="_blank"><img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white"></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white"></a>
  <a href="https://tailwindcss.com/" target="_blank"><img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss&logoColor=white"></a>
  <a href="https://www.radix-ui.com/" target="_blank"><img alt="Radix UI" src="https://img.shields.io/badge/Radix%20UI-Components-161618?logo=radixui&logoColor=white"></a>
  <a href="https://lucide.dev/" target="_blank"><img alt="Lucide" src="https://img.shields.io/badge/Lucide-Icons-18181B?logo=lucide&logoColor=white"></a>
  <a href="https://www.prisma.io/" target="_blank"><img alt="Prisma" src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white"></a>
  <a href="https://www.postgresql.org/" target="_blank"><img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-DB-4169E1?logo=postgresql&logoColor=white"></a>
  <a href="https://vercel.com/analytics" target="_blank"><img alt="Vercel Analytics" src="https://img.shields.io/badge/Vercel-Analytics-000000?logo=vercel&logoColor=white"></a>
</p>

---

## Overview

One Day is a Next.js App Router project for capturing ideas, managing notes, and using AI to create, read, update, and delete notes via natural language. It includes email/password auth with secure httpOnly cookies, a PostgreSQL database via Prisma, and a chat assistant powered by Groq.

---

## Features

- ✅ **Auth** — register, login, logout, and session verification with JWT in httpOnly cookies.
- 📝 **Notes** — create, edit, delete, search, and color-code notes.
- 📤 **Import/Export** — JSON export and bulk import of notes.
- 🤖 **AI Chat** — conversational assistant with chat history and note actions (list/read/create/update/delete).
- 🎨 **Polished UI** — modern components, dark mode, and responsive layout.
- 📈 **Analytics** — Vercel Analytics enabled.

---

## Tech Stack

- Framework: Next.js 16 (App Router), React 19, TypeScript
- UI: Tailwind CSS v4, Radix UI, Lucide, next-themes
- Data: Prisma ORM + PostgreSQL
- Auth: JWT (httpOnly cookie)
- AI: Groq Chat Completions (llama-3.1-8b-instant)
- Utilities: React Hook Form, Zod, Sonner

---

## Getting Started

Prerequisites:
- Node.js 18+ recommended
- pnpm (or npm/yarn)

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open http://localhost:3000 with your browser to see the result.

Build for production:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

Lint:

```bash
pnpm lint
```

---

## Project Structure

- [app](app) — App Router pages and API routes
  - [app/api](app/api) — auth, notes, and chat endpoints
  - [app/login](app/login) — login page
  - [app/profile](app/profile) — profile page
- [components](components) — UI and feature components
- [contexts](contexts) — notes context for refresh hooks
- [lib](lib) — auth utilities, Prisma client, helpers
- [prisma](prisma) — schema and migrations
- [public](public) — static assets

---

## UI & Styling

- Fonts: Geist and Geist Mono via next/font in the root layout.
- Themes: Dark mode powered by next-themes.
- Components: Radix UI primitives styled with Tailwind utilities.

---

## Environment

Create a [.env](.env) file in the project root:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
JWT_SECRET="your-strong-random-secret-key-min-32-chars"
GROQ_API_KEY="your-groq-api-key"
```

Database setup details are documented in [DATABASE_SETUP.md](DATABASE_SETUP.md).

---

## Deployment

- Vercel is recommended.
- Ensure the environment variables above are set in your deployment target.

---

## Scripts

- dev — start dev server
- build — compile production build
- start — run production server
- lint — run ESLint
- db:push — push Prisma schema to the database
- db:migrate — run Prisma migrations (production)

---

## Contributing

- Use conventional commits if possible.
- Run `pnpm lint` before pushing.
- Open a PR with a clear description and screenshots for UI changes.

---

## License

This project is currently unlicensed. Add a [LICENSE](LICENSE) file to specify terms.
