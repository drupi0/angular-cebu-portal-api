import { Pool } from 'pg';

const [userId, role] = process.argv.slice(2);
if (
  !/^[0-9a-f-]{36}$/i.test(userId ?? '') ||
  !['member', 'organizer'].includes(role)
) {
  throw new Error('Usage: npm run auth:set-role -- USER_UUID member|organizer');
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const result = await pool.query(
    'UPDATE "user" SET role = $1, "updatedAt" = now() WHERE id = $2 AND "emailVerified" = true RETURNING id',
    [role, userId],
  );
  if (!result.rowCount)
    throw new Error(
      'Verified user not found; verify the identity before assigning a role',
    );
  console.log(`Updated role to ${role} for ${result.rows[0].id}`);
} finally {
  await pool.end();
}
