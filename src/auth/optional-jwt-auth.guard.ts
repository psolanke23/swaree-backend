import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard — runs the JWT strategy but never throws.
 * If a valid Bearer token is present, req.user is populated as normal.
 * If no token (or an invalid one) is provided, req.user is simply null/undefined.
 * Use on endpoints that serve both authenticated users and guests.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // Override so that missing/expired tokens don't throw a 401
  handleRequest<TUser>(_err: unknown, user: TUser): TUser | null {
    return user ?? null;
  }
}
