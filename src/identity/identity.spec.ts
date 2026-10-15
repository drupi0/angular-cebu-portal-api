import { validateIdentity } from './auth';
import { readConfig } from './config';

describe('Identity policy', () => {
  it('requires a real email instead of inventing a provider fallback', () => {
    expect(
      validateIdentity({ user: {}, source: { action: 'create-user' } })?.error,
    ).toBe('email_required');
  });

  it('allows a new provider identity without pretending its email is verified', () => {
    const user = { email: 'member@example.test', emailVerified: false };
    expect(
      validateIdentity({ user, source: { action: 'create-user' } }),
    ).toBeUndefined();
    expect(user.emailVerified).toBe(false);
  });

  it('requires verification when connecting another provider to an existing user', () => {
    expect(
      validateIdentity({
        user: { email: 'member@example.test', emailVerified: false },
        source: { action: 'link-account' },
      })?.error,
    ).toBe('email_not_verified');
    expect(
      validateIdentity({
        user: { email: 'member@example.test', emailVerified: true },
        source: { action: 'link-account' },
      }),
    ).toBeUndefined();
  });
});

describe('Production auth configuration', () => {
  const valid = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://localhost/test',
    BETTER_AUTH_SECRET: 'test-only-secret-with-at-least-thirty-two-characters',
    BETTER_AUTH_URL: 'https://api.example.test',
    PORTAL_ORIGIN: 'https://portal.example.test',
    GOOGLE_CLIENT_ID: 'test-id',
    GOOGLE_CLIENT_SECRET: 'test-secret',
  };

  it('does not enable unverified local password accounts in production', () => {
    expect(readConfig(valid).AUTH_EMAIL_PASSWORD_ENABLED).toBe('false');
    expect(() =>
      readConfig({ ...valid, AUTH_EMAIL_PASSWORD_ENABLED: 'true' }),
    ).toThrow('Email/password login is local-only');
  });

  it('requires HTTPS and complete provider credentials', () => {
    expect(() =>
      readConfig({ ...valid, PORTAL_ORIGIN: 'http://portal.example.test' }),
    ).toThrow('HTTPS');
    expect(() => readConfig({ ...valid, GOOGLE_CLIENT_SECRET: '' })).toThrow(
      'both credentials',
    );
  });

  it('refuses missing secrets without disclosing their values', () => {
    expect(() =>
      readConfig({ ...valid, BETTER_AUTH_SECRET: 'short-secret' }),
    ).toThrow('Invalid environment configuration: BETTER_AUTH_SECRET');
  });
});
