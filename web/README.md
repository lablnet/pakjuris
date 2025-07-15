# PakJuris Web

## Overview

The **Web** folder houses the client-side application for the PakJuris platform.  It is a single-page app built with **React 19**, **TypeScript**, and **Vite 6**, styled with **Tailwind CSS** and powered by **Zustand** for state management.

It consumes the REST/streaming endpoints exposed by the [`server/`](../server/README.md) package to provide:

- Email-based authentication & profile management
- Conversational chat UI backed by LLMs
- PDF preview & viewer utilities
- Real-time status updates via Server-Sent Events

---

## Tech Stack

| Category | Library / Tool |
|----------|----------------|
| Framework | React 19 + React-Router DOM 7 |
| Build Tool | Vite 6 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + tailwind-merge |
| State | Zustand |
| Networking | Axios | 
| Animations | Framer-Motion |

---

## Prerequisites

- **Node.js ≥ 18** (recommended 20 to match the server)
- **pnpm** package manager (`npm i -g pnpm`)
- The PakJuris **server** running locally (defaults to `http://localhost:8000`)

---

## Installation

```bash
# navigate into the web folder
cd pakjuris/web

# install third-party packages
pnpm install
```

---

## Development

Start a dev server with hot-module reload:

```bash
pnpm dev
```

The site becomes available at `http://localhost:5173` by default.

> **Tip:** If you run the backend and frontend concurrently, ensure CORS is enabled in the server (it already is for localhost:5173).

---

## Environment Configuration

Update the `.env` file with the correct values for the environment variables.

```bash
cp .env.example .env
```

Set the value for `VITE_API_BASE_URL` to the URL of the server.

---

## Build for Production

```bash
pnpm build   # generates static assets in dist/
```

Preview the production build locally:

```bash
pnpm preview
```

---

## Available pnpm Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Type-check & bundle for production |
| `pnpm preview` | Serve the `dist/` build locally |
| `pnpm lint` | Run ESLint across the codebase |

---

## Project Structure (high-level)

```
web/
├─ src/
│  ├─ assets/        # Static images & logos
│  ├─ components/    # Reusable UI building blocks
│  ├─ contexts/      # React context providers (Auth, UI …)
│  ├─ hooks/         # Custom hooks grouped by domain
│  ├─ pages/         # Route-level components
│  ├─ services/      # API helpers
│  ├─ stores/        # Zustand stores
│  ├─ utils/         # Utility helpers
│  ├─ App.tsx        # Root component
│  └─ main.tsx       # Vite entry point
├─ public/           # Static assets copied as-is
├─ tailwind.config.js
├─ vite.config.ts
└─ README.md        # (this file)
```

---

## Deployment

The build output in `dist/` is entirely static and can be served from any CDN, object-storage bucket (e.g. S3), or traditional web server.

1. `pnpm build`
2. Upload contents of `dist/` to your hosting provider
3. Configure a rewrite rule so that all routes fallback to `index.html` (required for SPA routing)

---

## Contributing

1. Fork / clone the repo
2. Create a feature branch (`git checkout -b feat/web-feature`)
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
4. Open a pull request 🎉

---

## License

Distributed under the MIT License. See the root `LICENSE` file for details.
