# One Day App ✨

Beautiful, fast, and modern web app built with Next.js, React 19, Tailwind CSS, and Radix UI.

<p align="left">
  <a href="https://nextjs.org" target="_blank"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white"></a>
  <a href="https://react.dev" target="_blank"><img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white"></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white"></a>
  <a href="https://tailwindcss.com/" target="_blank"><img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss&logoColor=white"></a>
  <a href="https://www.radix-ui.com/" target="_blank"><img alt="Radix UI" src="https://img.shields.io/badge/Radix%20UI-Components-161618?logo=radixui&logoColor=white"></a>
  <a href="https://lucide.dev/" target="_blank"><img alt="Lucide" src="https://img.shields.io/badge/Lucide-Icons-18181B?logo=lucide&logoColor=white"></a>
  <a href="https://vercel.com/analytics" target="_blank"><img alt="Vercel Analytics" src="https://img.shields.io/badge/Vercel-Analytics-000000?logo=vercel&logoColor=white"></a>
</p>

---

## Overview

One Day App is a modern Next.js application scaffolded with the App Router, React 19 concurrent features, Tailwind CSS v4, and a suite of accessible, composable Radix UI primitives. It comes with analytics out of the box via Vercel Analytics.

> Display name: `One Day App`  
> Package name: `my-v0-project`

---

## Features

- 🚀 **Next.js 16 (App Router)** — file-based routing, streaming, and edge-ready.
- ⚛️ **React 19** — modern concurrent rendering and hooks.
- 🎨 **Tailwind CSS v4** — utility-first styling with animation support.
- 🎛️ **Radix UI** — accessible, unstyled components to build polished UIs.
- 🧩 **Lucide Icons** — crisp, consistent iconography.
- 📈 **Vercel Analytics** — zero-config analytics included.
- ✅ **TypeScript** — strict types for safer refactoring.

---

## Tech Stack

- Framework: Next.js 16 (`next`)
- UI: React 19, Tailwind CSS 4, Radix UI, Lucide
- Forms & Validation: React Hook Form + Zod
- Charts & UI Extras: Recharts, Embla Carousel, CMDK, Sonner, Vaul
- Analytics: `@vercel/analytics`

---

## Getting Started

Prerequisites:
- Node.js 18+ recommended
- npm (or pnpm/yarn)

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000 with your browser to see the result.

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

---

## Project Structure

```
/one-day-app-idea
├─ app/                 # App Router (layouts, pages, API routes)
│  └─ layout.tsx        # Root layout with Vercel Analytics
├─ public/              # Static assets
├─ next.config.mjs      # Next.js configuration
├─ tailwind.config.*    # Tailwind CSS config (v4 uses @tailwindcss/postcss)
├─ tsconfig.json        # TypeScript configuration
└─ package.json         # Scripts and dependencies
```

---

## UI & Styling

- Fonts: Google Fonts `Geist`, `Geist Mono` loaded via `next/font` in `app/layout.tsx`.
- Themes: Powered by Tailwind CSS; add `next-themes` for dark mode toggling if desired.
- Components: Compose Radix primitives and style with Tailwind utilities.

Icon example (Lucide):

```tsx
import { Sparkles } from "lucide-react";

export function CTA() {
  return (
    <button className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-white">
      <Sparkles className="size-4" />
      Get Started
    </button>
  )
}
```

---

## Environment

No required environment variables by default. If you add external services, document them here as:

```bash
NEXT_PUBLIC_...=value
```

---

## Deployment

- Vercel is recommended. This project works great with `next start` or fully serverless on Vercel.
- Ensure image optimization is configured; this template uses `images.unoptimized: true` (see `next.config.mjs`).

---

## Scripts

- `dev` — start dev server
- `build` — compile production build
- `start` — run production server
- `lint` — run ESLint

---

## Contributing

- Use conventional commits if possible.
- Run `npm run lint` before pushing.
- Open a PR with a clear description and screenshots for UI changes.

---

## License

This project is currently unlicensed. Add a `LICENSE` file to specify terms.
