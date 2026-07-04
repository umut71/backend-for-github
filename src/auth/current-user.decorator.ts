import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';

/**
 * Returns the currently authenticated user.
 *
 * IMPORTANT: This relies on `JwtAuthGuard` (Passport JWT strategy) having
 * already run and populated `request.user` with the full user record
 * (see `JwtStrategy.validate`). It must NOT attempt to re-verify the JWT
 * itself here, since a manually constructed `JwtService` has no secret
 * configured and would always throw.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.user) {
      throw new UnauthorizedException('Not authenticated');
    }

    return request.user;
  },
);


