import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    // Cấu hình để passport-local dùng 'username' thay vì mặc định là 'email' nếu cần
    super({ usernameField: 'username' });
  }

  async validate(username: string, pass: string): Promise<Omit<User, 'password'>> {
    console.log(`LocalStrategy: Validating user ${username}`);
    const user = await this.authService.validateUser(username, pass);
    if (!user) {
      console.log(`LocalStrategy: Validation failed for user ${username}`);
      throw new UnauthorizedException('Sai username hoặc password');
    }
     console.log(`LocalStrategy: Validation successful for user ${username}`);
     const { password, ...result } = user;
     return {
       ...result,
       hashPassword: user.hashPassword.bind(user),
       validatePassword: user.validatePassword.bind(user)
     };
  }
}