import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { AUTH, PortalAuth, PortalSession } from './auth';
import { APP_CONFIG, AppConfig } from './config';

const PUBLIC = Symbol('PUBLIC');
const ORGANIZER = Symbol('ORGANIZER');
export const Public = () => SetMetadata(PUBLIC, true);
export const OrganizerOnly = () => SetMetadata(ORGANIZER, true);
export type AuthenticatedRequest = Request & { authSession: PortalSession };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH) private readonly auth: PortalAuth,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride(PUBLIC, targets)) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
      ![this.config.PORTAL_ORIGIN, this.config.BETTER_AUTH_URL].includes(
        request.headers.origin || '',
      )
    ) {
      throw new ForbiddenException('Untrusted request origin');
    }
    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) throw new UnauthorizedException('Please sign in');
    request.authSession = session;
    if (
      this.reflector.getAllAndOverride(ORGANIZER, targets) &&
      session.user.role !== 'organizer'
    )
      throw new ForbiddenException('Organizer access required');
    return true;
  }
}
