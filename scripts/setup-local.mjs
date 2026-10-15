import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const password = randomBytes(24).toString('hex');
const template = readFileSync(
  new URL('../.env.example', import.meta.url),
  'utf8',
)
  .replace('POSTGRES_PASSWORD=', `POSTGRES_PASSWORD=${password}`)
  .replace('REPLACE_ME', password)
  .replace(
    'BETTER_AUTH_SECRET=',
    `BETTER_AUTH_SECRET=${randomBytes(48).toString('base64url')}`,
  );
writeFileSync(new URL('../.env', import.meta.url), template, {
  flag: 'wx',
  mode: 0o600,
});
console.log(
  'Created .env with local credentials. Run npm run db:up, then npm run db:migrate.',
);
