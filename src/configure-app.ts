import { INestApplication } from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import { json, urlencoded } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { AUTH, PortalAuth } from './identity/auth';
import { APP_CONFIG, AppConfig } from './identity/config';

export function configureApp(app: INestApplication) {
  const config = app.get<AppConfig>(APP_CONFIG);
  const express = app.getHttpAdapter().getInstance();
  const proxies = config.TRUSTED_PROXY_CIDRS.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  express.set('trust proxy', proxies.length ? proxies : false);
  app.enableCors({
    origin: config.PORTAL_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  });
  express.use(
    '/api/auth',
    (request: Request, _response: Response, next: NextFunction) => {
      // Overwrite any client-supplied value; Express only trusts configured proxies.
      request.headers['x-angular-cebu-client-ip'] =
        request.ip || request.socket.remoteAddress || '';
      next();
    },
  );
  // Mount before the Nest parser so Better Auth can consume the request body.
  express.all('/api/auth/{*path}', toNodeHandler(app.get<PortalAuth>(AUTH)));
  app.use(json({ limit: '32kb' }));
  app.use(urlencoded({ extended: false, limit: '32kb' }));
  return app;
}
