# Identity and profile contract

Phase 2 chooses PostgreSQL for the replacement backend. Better Auth runs inside NestJS; there is no separate identity-server deployment.

## Stable identity

`user.id` is the stable PostgreSQL UUID for a member. Future events and registrations must reference that UUID, not a display name, email address or provider access token. `account` binds a provider ID plus its stable external account ID to one user; a unique database index prevents the same external identity belonging to multiple users.

Phase 3 will introduce an explicit mapping from legacy Appwrite participant/user identifiers to these UUIDs. Matching email alone must not claim historical attendance, certificates or organizer privileges. Preserve old identifiers/QR payloads and require a verified claim or organizer-reviewed reconciliation before linking them.

## Login and linking

Sessions are stored in PostgreSQL and carried in HttpOnly, SameSite=Lax cookies (Secure in production). Session cookie caching is disabled so expiry, revocation and role changes are checked against the database. Sessions last seven days, with renewal after one day of activity. Better Auth's database-backed rate limiting protects auth routes outside tests.

Implicit account linking is disabled. A user signs in with their original method, then explicitly connects another provider from settings. Linking requires the same verified email, does not trust an arbitrary provider's unverified email and does not overwrite the existing profile. A matching email from a different login method yields `account_not_linked` rather than silently merging accounts.

Facebook and other providers may omit email or its verification status. No synthetic email or forced verification flag is supplied. Missing email is rejected with guidance to grant email access or use another provider. A new provider identity with an unverified email may sign in, but its email stays unverified, cannot establish ownership of another account, and cannot be promoted by the organizer command until verified. Email verification/recovery delivery is future work; email/password registration is restricted to local development.

## Application endpoints

| Endpoint | Access | Behavior |
| --- | --- | --- |
| `GET /api/public/auth-options` | Public | Enabled provider names and availability of local password login; no credentials |
| `/api/auth/*` | Better Auth | Signup/sign-in, OAuth callback/linking, session management and logout |
| `GET /api/me` | Session | Current user's UUID, name, email/verification, photo URL, contact number and role |
| `PATCH /api/me` | Session + trusted Origin | Current user's name, HTTPS photo URL and optional contact number only |
| `GET /api/organizer/access` | Organizer session | Confirms organizer access for subsequent organizer features |

Profile responses use `Cache-Control: no-store`. Contact number is optional profile data, not a verified login identifier. The API does not accept a target user ID, email, verification flag or role in profile changes. Unknown keys are rejected. Better Auth's own profile route applies the same value validation and does not accept role input.

New identities have the `member` role. The only role-management mechanism in this phase is the backend maintenance command documented in the README. Frontend guards improve navigation; NestJS guards enforce access independently.

The exact configured portal origin is allowed for credentialed CORS requests. Protected application mutations require a trusted Origin. Better Auth handles its own origin/CSRF checks, explicitly enabled in tests as well as normal operation. Auth handlers are mounted before Express body parsing.

## Verification limits

Automated HTTP tests use a real disposable PostgreSQL database and configured test OAuth credentials to inspect initiation/state/callback URLs. They do not contact external provider token endpoints. Google, GitHub and Facebook credential setup and a real callback/linking rehearsal remain required before production activation. The old Appwrite event workflow is outside this phase's identity contract.
