import { Injectable } from '@nestjs/common';
import {
  ExecutionContext,
  CanActivate,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!this.isUserAdmin(user)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }

  private isUserAdmin(user: any): boolean {
    return user && user.role === 'admin';
  }
}
