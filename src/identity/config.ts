import { parseEnv } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';
import { isIP } from 'node:net';

export const APP_CONFIG = Symbol('APP_CONFIG');
export const providerNames = ['google', 'github', 'facebook'] as const;
export type ProviderName = (typeof providerNames)[number];

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  if (env === process.env && existsSync('.env'))
    env = { ...parseEnv(readFileSync('.env', 'utf8')), ...env };
  const result = z
    .object({
      NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
      PORT: z.coerce.number().int().min(1).max(65535).default(3000),
      DATABASE_URL: z.url().refine((value) => /^postgres(ql)?:/.test(value)),
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.url(),
      PORTAL_ORIGIN: z.url(),
      TRUSTED_PROXY_CIDRS: z.string().default(''),
      AUTH_EMAIL_PASSWORD_ENABLED: z.enum(['true', 'false']).default('false'),
    })
    .safeParse(env);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
    );
  }
  const config = result.data;
  for (const proxy of config.TRUSTED_PROXY_CIDRS.split(',')
    .map((value) => value.trim())
    .filter(Boolean)) {
    const [ip, prefix, extra] = proxy.split('/');
    const version = isIP(ip);
    if (
      !version ||
      extra !== undefined ||
      (prefix !== undefined &&
        (!/^\d+$/.test(prefix) ||
          Number(prefix) < 1 ||
          Number(prefix) > (version === 4 ? 32 : 128)))
    ) {
      throw new Error(
        'TRUSTED_PROXY_CIDRS must contain specific proxy IPs or CIDRs',
      );
    }
  }
  for (const key of ['BETTER_AUTH_URL', 'PORTAL_ORIGIN'] as const) {
    const url = new URL(config[key]);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.origin !== config[key]
    ) {
      throw new Error(
        `${key} must be an HTTP(S) origin without a path or trailing slash`,
      );
    }
    if (config.NODE_ENV === 'production' && url.protocol !== 'https:')
      throw new Error(`${key} requires HTTPS in production`);
  }
  if (
    config.NODE_ENV === 'production' &&
    config.AUTH_EMAIL_PASSWORD_ENABLED === 'true'
  ) {
    throw new Error(
      'Email/password login is local-only until email verification and recovery are configured',
    );
  }
  const socialProviders: Partial<
    Record<ProviderName, { clientId: string; clientSecret: string }>
  > = {};
  for (const name of providerNames) {
    const clientId = env[`${name.toUpperCase()}_CLIENT_ID`];
    const clientSecret = env[`${name.toUpperCase()}_CLIENT_SECRET`];
    if (!!clientId !== !!clientSecret)
      throw new Error(`Provide both credentials for ${name}`);
    if (clientId && clientSecret)
      socialProviders[name] = { clientId, clientSecret };
  }
  if (config.NODE_ENV === 'production' && !Object.keys(socialProviders).length)
    throw new Error('Configure at least one social provider in production');
  return { ...config, socialProviders };
}

export type AppConfig = ReturnType<typeof readConfig>;
