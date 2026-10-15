import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { Pool } from 'pg';
import { z } from 'zod';
import type { AppConfig } from './config';

export const AUTH = Symbol('AUTH');
export const nameSchema = z.string().trim().min(2).max(100);
export const imageSchema = z
  .url()
  .max(2048)
  .refine(
    (value) => new URL(value).protocol === 'https:',
    'Use an HTTPS image URL',
  )
  .nullable();
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,25}$/, 'Enter a valid contact number')
  .nullable();
export const profileSchema = z
  .object({
    name: nameSchema.optional(),
    image: imageSchema.optional(),
    phoneNumber: phoneSchema.optional(),
  })
  .strict();

export function validateIdentity({
  user,
  source,
}: {
  user: { email?: unknown; emailVerified?: boolean };
  source: { action: string };
}) {
  if (!user.email || !z.email().safeParse(user.email).success) {
    return {
      error: 'email_required',
      errorDescription:
        'Your provider did not share an email. Choose another provider or allow email access.',
    };
  }
  if (source.action === 'link-account' && !user.emailVerified) {
    return {
      error: 'email_not_verified',
      errorDescription:
        'Your provider must verify the email before connecting it to an existing account.',
    };
  }
}

async function validateProfile(data: {
  name?: string;
  image?: string | null;
  phoneNumber?: string | null;
}) {
  const parsed = profileSchema.safeParse({
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.image !== undefined ? { image: data.image } : {}),
    ...(data.phoneNumber !== undefined
      ? { phoneNumber: data.phoneNumber }
      : {}),
  });
  if (!parsed.success)
    throw new APIError('BAD_REQUEST', {
      message: 'Invalid name, image URL or contact number',
    });
  return { data: { ...data, ...parsed.data } };
}

export function createAuth(pool: Pool, config: AppConfig) {
  return betterAuth({
    appName: 'Angular Cebu',
    database: pool,
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.BETTER_AUTH_URL,
    basePath: '/api/auth',
    trustedOrigins: [config.PORTAL_ORIGIN, config.BETTER_AUTH_URL],
    advanced: {
      database: { generateId: 'uuid' },
      useSecureCookies: config.NODE_ENV === 'production',
      disableOriginCheck: false,
      disableCSRFCheck: false,
      ipAddress: { ipAddressHeaders: ['x-angular-cebu-client-ip'] },
    },
    emailAndPassword: {
      enabled: config.AUTH_EMAIL_PASSWORD_ENABLED === 'true',
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    socialProviders: config.socialProviders,
    account: {
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
        disableImplicitLinking: true,
        trustedProviders: [],
        allowDifferentEmails: false,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: config.NODE_ENV !== 'test',
      window: 60,
      max: 60,
      storage: 'database',
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: true,
          defaultValue: 'member',
          input: false,
        },
        phoneNumber: {
          type: 'string',
          required: false,
          validator: { input: phoneSchema },
        },
      },
      validateUserInfo: validateIdentity,
    },
    databaseHooks: {
      user: {
        create: { before: validateProfile },
        update: { before: validateProfile },
      },
    },
    telemetry: { enabled: false },
  });
}

export type PortalAuth = ReturnType<typeof createAuth>;
export type PortalSession = PortalAuth['$Infer']['Session'];
