# Angular Cebu Portal API

NestJS 12 API with Better Auth 1.7.7 embedded in the same process and PostgreSQL persistence. See the [shared phase checklist](../angular-cebu-portal/PHASES.md) and [identity contract](docs/identity.md).

## Local setup

Use Node.js 24.20.0 (`.nvmrc`) and Docker with Compose:

```sh
nvm install
nvm use
npm ci
npm run setup:local
npm run db:up
npm run db:migrate
npm run start:dev
```

`setup:local` creates an ignored `.env` with random database and auth secrets and mode 0600. It refuses to overwrite an existing file. `.env.example` documents the configuration. Shell environment variables take precedence over `.env`.

PostgreSQL listens on `127.0.0.1:54329` and persists in the `angular-cebu_postgres_data` Docker volume. `npm run db:down` stops it without deleting that volume. The API listens on port 3000. Start the sibling portal on `http://localhost:4200`; its development proxy forwards `/api` here.

Local development enables email/password signup and login so the complete account flow can be tested without provider credentials. Passwords require 12–128 characters. This mode does not send verification or recovery email and is rejected when `NODE_ENV=production`. Production sign-in uses configured social providers until verification/recovery delivery is implemented.

## Social sign-in

Add each provider's client ID and secret to the backend `.env`. Do not put secrets in the portal. Only configured providers appear on the login page:

| Provider | Environment variables | Local OAuth callback |
| --- | --- | --- |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `http://localhost:3000/api/auth/callback/google` |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `http://localhost:3000/api/auth/callback/github` |
| Facebook | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | `http://localhost:3000/api/auth/callback/facebook` |

Register the callback in the provider console. Use GitHub's email permission and Facebook's email/public-profile permissions. For production, use the actual public `BETTER_AUTH_URL` origin instead of localhost; configure `PORTAL_ORIGIN` to the frontend origin. Both must use HTTPS in production. Serve/proxy the portal's `/api/*` requests to this API and preserve the callback path, cookies and browser Origin header. Social callbacks return to the frontend's absolute settings/login URL.

When deploying behind a reverse proxy, set `TRUSTED_PROXY_CIDRS` to that proxy's specific IPs/CIDRs and have it forward the client IP. Empty trusts no proxy. The API overwrites its internal client-IP header before Better Auth sees it, preventing clients from choosing their own rate-limit identity. Without proxy configuration, users behind the proxy share its rate-limit bucket.

Missing provider email fails with an actionable login message. Unverified provider email is retained as unverified; it is not proof of ownership of an existing account. Explicit linking requires signing in first and the same verified provider email. See [identity rules](docs/identity.md).

Provider setup references: [Google](https://better-auth.com/docs/authentication/google), [GitHub](https://better-auth.com/docs/authentication/github), [Facebook](https://better-auth.com/docs/authentication/facebook).

## Database changes and organizer access

SQL migrations are checked into `migrations/`. Run `npm run db:migrate` explicitly before starting an upgraded deployment. The runner uses a transaction, an advisory lock and checksums; repeat runs skip applied migrations and modified historical migrations are rejected. Add a new migration instead of editing an applied one. Back up persistent data before production schema changes; there is no automatic destructive rollback command.

New users are members. An operator with database access can promote a verified identity by its UUID:

```sh
npm run auth:set-role -- USER_UUID organizer
npm run auth:set-role -- USER_UUID member
```

This is a server-side maintenance command, not a public permission endpoint. Roles cannot be changed through signup or profile updates. All NestJS endpoints require a live session unless explicitly marked public. Organizer endpoints additionally require the stored organizer role.

## Checks

```sh
npm run build
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npx tsc --noEmit
```

Unit tests do not need a database. HTTP integration tests require the local PostgreSQL setup above and a database user with `CREATEDB`. They create a uniquely named disposable database, apply the real migrations twice, exercise real Better Auth cookies and persistence, then drop only that test database. Do not point tests at a production database server.

The integration suite covers signup/login/logout, durable sessions, profile ownership, input validation, role assignment boundaries, expiry/revocation, CSRF/origin rejection, OAuth initiation for all three providers and migration repeatability. Provider token exchange and callback completion still require real provider credentials and a live rehearsal.

The production build emits `dist/main.js`; run it with `npm run start:prod`. The app uses Node 24's ESM interoperability; Jest enables VM modules for ESM dependencies.

## Transitional scope

The running application no longer connects to MongoDB or mounts the legacy `/auth`, `/member` and `/event` controllers. Those source modules and their unit tests remain for reference until the Phase 3 domain migration. Their JWT credentials and client-supplied roles are not accepted by the new API.

Event listings, registration, attendance, email and certificates in the portal still use Appwrite and are not restored by this authentication phase. New accounts are not automatically linked to historical Appwrite records by matching email. No historical records have been migrated or deleted.
