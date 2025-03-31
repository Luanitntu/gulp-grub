import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    console.log('JWT Guard Info:', info);
    console.log('JWT Guard Error:', err);
    console.log('JWT Guard User:', user);

    if (err || !user) {
      console.error(
        'JWT Auth Guard Error:',
        err || info?.message || 'Token không hợp lệ hoặc hết hạn',
      );
      throw (
        err ||
        new UnauthorizedException(
          'Token không hợp lệ hoặc bạn không có quyền truy cập.',
        )
      );
    }
    return user;
  }
}
