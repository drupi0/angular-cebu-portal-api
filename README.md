# Angular Cebu Portal API

NestJS application for the Angular Cebu community portal. Framework upgrades are Phase 1 of the [shared migration checklist](../angular-cebu-portal/PHASES.md).

## Requirements

- Node.js 24.20.0 (`.nvmrc`); use `nvm install` and `nvm use`.
- npm and the checked-in `package-lock.json`.
- MongoDB for normal application startup. Phase 1 preserves the existing persistence/authentication model; Better Auth and the replacement database belong to later phases.

## Local development

```sh
nvm use
npm ci
MONGO_URL=mongodb://127.0.0.1:27017 npm run start:dev
```

The existing database configuration appends `/database` to `MONGO_URL`. Use a server URL without a database path or query string. The API listens on port 3000 and permits the portal at `http://localhost:4200`.

Set `SECRET_KEY` and, optionally, `TOKEN_EXPIRY` in the shell environment when using the legacy login endpoints. No `.env` loader is currently configured. Phase 1 is a framework upgrade, not a production-readiness sign-off for the existing authentication and authorization code.

## Checks

```sh
npm run build
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npx tsc --noEmit
```

The HTTP smoke tests compile the real application module graph, use a disconnected Mongoose connection and mock event reads. They check startup, routing, serialization and authentication failures without a running database. They do not verify live MongoDB persistence or the future Better Auth flow.

NestJS 12 distributes ESM packages. The application remains CommonJS using Node's ESM interoperability; Jest scripts enable VM modules for those dependencies. TypeScript 6.0 is pinned to match the selected tooling. The normal build produces `dist/main.js`:

```sh
npm run build
npm run start:prod
```

## Current upgrade versions

- NestJS core/common/platform/testing: 12.1.3
- Nest CLI: 12.0.8
- TypeScript: 6.0.3
- Mongoose: 9.11.2

Dependency changes are recorded in `package-lock.json`. Follow `PHASES.md` before replacing Appwrite or changing the database/authentication model.
