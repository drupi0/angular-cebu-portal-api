import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalGuard extends AuthGuard('local') {
}

@Injectable()
export class TokenGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
      }
    
      handleRequest(err, user, info) {
        if (err || !user) {
          throw err || new UnauthorizedException("Invalid auth token");
        }
        return user;
      }
}