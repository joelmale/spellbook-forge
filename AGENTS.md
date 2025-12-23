# Repository Guidelines

## Project Structure & Module Organization
The app is a client-only Vite + React project. Key paths:
- `client/src/` for React components, hooks, pages, and app entry (`client/src/main.tsx`).
- `client/src/components/` for shared UI and feature components.
- `shared/schema.ts` for shared types/schemas used across the client.
- `client/public/` for static assets and spell JSON data (`spells-2014.json`, `spells-2024.json`).
- `dist/` is build output (generated).

## Build, Test, and Development Commands
Run commands from the repo root:
- `npm install` install dependencies.
- `npm run dev` start the Vite dev server at `http://localhost:5173`.
- `npm run build` produce a production build in `dist/`.
- `npm run check` run TypeScript type checking.

## Coding Style & Naming Conventions
- TypeScript + React with Tailwind CSS; prefer functional components and hooks.
- Use double quotes and semicolons to match existing style (see `client/src/main.tsx`).
- Component files are PascalCase (e.g., `client/src/components/SpellCard.tsx`).
- Keep Tailwind utility classes in JSX; avoid inline styles unless needed.

## Testing Guidelines
There are no automated test suites configured yet.
- Validate changes by running `npm run check` and exercising the UI locally.
- If adding tests later, document the framework and add a `test` script to `package.json`.

## Commit & Pull Request Guidelines
Git history is minimal and does not enforce a strict convention.
- Use short, imperative commit subjects (e.g., "Add spell filter").
- PRs should include: a concise description, steps to verify, and screenshots for UI changes.
- Link related issues or feature requests when applicable.

## Security & Configuration Tips
- Data is stored in the browser (IndexedDB); avoid adding server-side assumptions.
- Public spell data lives in `client/public/`; keep file names stable for imports.
