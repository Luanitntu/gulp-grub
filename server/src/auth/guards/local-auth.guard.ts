import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      console.error('LocalAuthGuard Error:', err || info?.message);
      throw (
        err || new UnauthorizedException('Xác thực thất bại từ Local Guard.')
      );
    }
    return user;
  }
}
