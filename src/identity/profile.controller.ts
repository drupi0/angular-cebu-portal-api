import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Patch,
  Req,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import { AUTH, PortalAuth, PortalSession, profileSchema } from './auth';
import { APP_CONFIG, AppConfig } from './config';
import { AuthenticatedRequest, OrganizerOnly, Public } from './session.guard';

function publicProfile(user: PortalSession['user']) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image ?? null,
    phoneNumber: user.phoneNumber ?? null,
    role: user.role,
  };
}

@Controller('api')
export class ProfileController {
  constructor(
    @Inject(AUTH) private readonly auth: PortalAuth,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Public()
  @Get('public/auth-options')
  options() {
    return {
      providers: Object.keys(this.config.socialProviders),
      emailPasswordEnabled: this.config.AUTH_EMAIL_PASSWORD_ENABLED === 'true',
    };
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  me(@Req() request: AuthenticatedRequest) {
    return publicProfile(request.authSession.user);
  }

  @Patch('me')
  @Header('Cache-Control', 'no-store')
  async update(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success || !Object.keys(parsed.data).length)
      throw new BadRequestException(
        'Provide a valid name, HTTPS photo URL or contact number only',
      );
    await this.auth.api.updateUser({
      headers: fromNodeHeaders(request.headers),
      body: parsed.data,
    });
    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    return publicProfile(session!.user);
  }

  @OrganizerOnly()
  @Get('organizer/access')
  organizer() {
    return { allowed: true };
  }
}
