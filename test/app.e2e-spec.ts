import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Pool } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { APP_CONFIG, readConfig } from '../src/identity/config';
import { createAuth } from '../src/identity/auth';

jest.setTimeout(30000);

describe('PostgreSQL identity HTTP integration', () => {
  let app: INestApplication;
  let admin: Pool;
  let pool: Pool;
  let config: ReturnType<typeof readConfig>;
  const database = `angular_cebu_test_${randomUUID().replaceAll('-', '')}`;
  const origin = 'http://localhost:4200';
  const password = 'local-test-password-2026';
  let created = false;

  beforeAll(async () => {
    const local = readConfig();
    admin = new Pool({ connectionString: local.DATABASE_URL });
    await admin.query(`CREATE DATABASE "${database}"`);
    created = true;
    const url = new URL(local.DATABASE_URL);
    url.pathname = `/${database}`;
    config = {
      ...local,
      DATABASE_URL: url.toString(),
      NODE_ENV: 'test',
      AUTH_EMAIL_PASSWORD_ENABLED: 'true',
      PORTAL_ORIGIN: origin,
      BETTER_AUTH_URL: 'http://localhost:3000',
      socialProviders: {
        google: { clientId: 'test-google', clientSecret: 'test-secret' },
        github: { clientId: 'test-github', clientSecret: 'test-secret' },
        facebook: { clientId: 'test-facebook', clientSecret: 'test-secret' },
      },
    };
    for (let i = 0; i < 2; i++)
      execFileSync(process.execPath, ['scripts/migrate.mjs'], {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: config.DATABASE_URL },
        stdio: 'pipe',
      });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(APP_CONFIG)
      .useValue(config)
      .compile();
    app = configureApp(module.createNestApplication({ bodyParser: false }));
    await app.init();
    pool = app.get(Pool);
  });

  afterAll(async () => {
    await app?.close();
    if (created) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
    await admin?.end();
  });

  async function signup(extra: Record<string, unknown> = {}) {
    const email = `${randomUUID()}@example.test`;
    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Origin', origin)
      .set('x-angular-cebu-client-ip', '203.0.113.9')
      .send({ name: 'Cebu Member', email, password, ...extra })
      .expect(200);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies.join(';')).toContain('HttpOnly');
    expect(cookies.join(';')).toContain('SameSite=Lax');
    return {
      cookie: cookies.map((value) => value.split(';')[0]).join('; '),
      user: response.body.user,
      email,
    };
  }

  it('boots without MongoDB and reports configured sign-in options', async () => {
    await request(app.getHttpServer()).get('/').expect(200);
    const response = await request(app.getHttpServer())
      .get('/api/public/auth-options')
      .expect(200);
    expect(response.body).toEqual({
      providers: ['google', 'github', 'facebook'],
      emailPasswordEnabled: true,
    });
    expect(JSON.stringify(response.body)).not.toContain('test-secret');
  });

  it('rejects unauthenticated profiles and retired legacy endpoints', async () => {
    await request(app.getHttpServer()).get('/api/me').expect(401);
    await request(app.getHttpServer()).post('/auth/login').send({}).expect(404);
    await request(app.getHttpServer())
      .post('/member/create')
      .send({ roles: ['ADMIN'] })
      .expect(404);
    await request(app.getHttpServer())
      .post('/event/create')
      .send({})
      .expect(404);
  });

  it('persists a profile, signs out, and signs back in with the same stable identity', async () => {
    const member = await signup();
    expect(member.user.id).toMatch(/^[0-9a-f-]{36}$/i);
    const sessionRow = await pool.query(
      'SELECT "ipAddress" FROM session WHERE "userId" = $1',
      [member.user.id],
    );
    expect(sessionRow.rows[0].ipAddress).toBeTruthy();
    expect(sessionRow.rows[0].ipAddress).not.toBe('203.0.113.9');
    await request(app.getHttpServer())
      .patch('/api/me')
      .set('Origin', origin)
      .set('Cookie', member.cookie)
      .send({
        name: 'Updated Member',
        phoneNumber: '+63 917 123 4567',
        image: 'https://example.test/avatar.png',
      })
      .expect(200);
    const row = await pool.query(
      'SELECT name, "phoneNumber" FROM "user" WHERE id = $1',
      [member.user.id],
    );
    expect(row.rows[0]).toEqual({
      name: 'Updated Member',
      phoneNumber: '+63 917 123 4567',
    });
    // A separate auth instance reads the persisted session, without process memory.
    const independentAuth = createAuth(pool, config);
    const persisted = await independentAuth.api.getSession({
      headers: new Headers({ cookie: member.cookie }),
    });
    expect(persisted?.user.id).toBe(member.user.id);
    await request(app.getHttpServer())
      .post('/api/auth/sign-out')
      .set('Origin', origin)
      .set('Cookie', member.cookie)
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', member.cookie)
      .expect(401);
    const login = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('Origin', origin)
      .send({ email: member.email, password })
      .expect(200);
    expect(login.body.user.id).toBe(member.user.id);
  });

  it('does not allow self-promotion through signup, profile or Better Auth update routes', async () => {
    const member = await signup({ role: 'organizer', emailVerified: true });
    expect(member.user.role).toBe('member');
    expect(member.user.emailVerified).toBe(false);
    await request(app.getHttpServer())
      .patch('/api/me')
      .set('Origin', origin)
      .set('Cookie', member.cookie)
      .send({ role: 'organizer' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/auth/update-user')
      .set('Origin', origin)
      .set('Cookie', member.cookie)
      .send({ name: 'Still a member', role: 'organizer', emailVerified: true });
    const profile = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', member.cookie)
      .expect(200);
    expect(profile.body.role).toBe('member');
    expect(profile.body.emailVerified).toBe(false);
    await request(app.getHttpServer())
      .get('/api/organizer/access')
      .set('Cookie', member.cookie)
      .expect(403);
    await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', [
      'organizer',
      member.user.id,
    ]);
    await request(app.getHttpServer())
      .get('/api/organizer/access')
      .set('Cookie', member.cookie)
      .expect(200);
    await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', [
      'member',
      member.user.id,
    ]);
    await request(app.getHttpServer())
      .get('/api/organizer/access')
      .set('Cookie', member.cookie)
      .expect(403);
  });

  it('edits only the current profile and rejects foreign identity fields', async () => {
    const alice = await signup();
    const bob = await signup();
    await request(app.getHttpServer())
      .patch('/api/me')
      .set('Origin', origin)
      .set('Cookie', alice.cookie)
      .send({ id: bob.user.id, name: 'Not Bob' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/me')
      .set('Origin', origin)
      .set('Cookie', alice.cookie)
      .send({ email: bob.email })
      .expect(400);
    const profile = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', bob.cookie)
      .expect(200);
    expect(profile.body.name).toBe('Cebu Member');
  });

  it('rejects cross-origin profile writes and invalid profile fields', async () => {
    const member = await signup();
    await request(app.getHttpServer())
      .patch('/api/me')
      .set('Origin', 'https://untrusted.example')
      .set('Cookie', member.cookie)
      .send({ name: 'Changed' })
      .expect(403);
    await request(app.getHttpServer())
      .patch('/api/me')
      .set('Cookie', member.cookie)
      .send({ name: 'Changed' })
      .expect(403);
    for (const body of [
      { name: ' ' },
      { phoneNumber: 'invalid' },
      { image: 'javascript:alert(1)' },
    ]) {
      await request(app.getHttpServer())
        .patch('/api/me')
        .set('Origin', origin)
        .set('Cookie', member.cookie)
        .send(body)
        .expect(400);
    }
    await request(app.getHttpServer())
      .post('/api/auth/update-user')
      .set('Origin', origin)
      .set('Cookie', member.cookie)
      .send({ image: 'javascript:alert(1)' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/me')
      .set('Origin', origin)
      .set('Cookie', member.cookie)
      .send({ phoneNumber: null, image: null })
      .expect(200);
  });

  it('rejects expired and revoked sessions without a cached authorization result', async () => {
    const expired = await signup();
    await pool.query(
      'UPDATE session SET "expiresAt" = $1 WHERE "userId" = $2',
      [new Date(Date.now() - 1000), expired.user.id],
    );
    await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', expired.cookie)
      .expect(401);
    const revoked = await signup();
    await request(app.getHttpServer())
      .post('/api/auth/revoke-sessions')
      .set('Origin', origin)
      .set('Cookie', revoked.cookie)
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', revoked.cookie)
      .expect(401);
  });

  it('rejects invalid credentials and untrusted auth origins', async () => {
    const member = await signup();
    await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('Origin', origin)
      .send({ email: member.email, password: 'wrong-password' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/sign-out')
      .set('Origin', 'https://untrusted.example')
      .set('Cookie', member.cookie)
      .send({})
      .expect(403);
  });

  it.each(['google', 'github', 'facebook'])(
    'starts %s OAuth with state and a configured callback',
    async (provider) => {
      const result = await request(app.getHttpServer())
        .post('/api/auth/sign-in/social')
        .set('Origin', origin)
        .send({
          provider,
          callbackURL: `${origin}/settings`,
          errorCallbackURL: `${origin}/login`,
          disableRedirect: true,
        })
        .expect(200);
      const url = new URL(result.body.url);
      expect(url.protocol).toBe('https:');
      expect(url.searchParams.get('state')).toBeTruthy();
      expect(url.searchParams.get('redirect_uri')).toBe(
        `http://localhost:3000/api/auth/callback/${provider}`,
      );
    },
  );

  it('records each migration once', async () => {
    const result = await pool.query(
      'SELECT name FROM schema_migrations ORDER BY name',
    );
    expect(result.rows).toEqual([
      { name: '001_identity.sql' },
      { name: '002_identity_constraints.sql' },
    ]);
  });
});
