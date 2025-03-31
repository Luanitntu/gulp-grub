import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service'; // Cần để lấy thông tin user đầy đủ nếu cần

// Định nghĩa kiểu dữ liệu của payload trong JWT
interface JwtPayload {
  sub: string; // Thường là user ID
  username: string;
  role: string; // Thêm role vào payload
  // Thêm các trường khác nếu cần
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') { // Đặt tên strategy là 'jwt'
  constructor(
    private configService: ConfigService,
    private usersService: UsersService, // Inject UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Lấy token từ header Authorization: Bearer <token>
      ignoreExpiration: false, // Không bỏ qua token hết hạn
      secretOrKey: configService.get<string>('JWT_SECRET'), // Key để giải mã token
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    // Payload đã được giải mã và xác thực chữ ký ở đây
    // console.log('JWT Payload:', payload); // Debug log

    // Bạn có thể lấy thông tin user đầy đủ từ DB dựa vào payload.sub (userId)
    // Nếu chỉ cần thông tin trong payload thì trả về payload là đủ
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) {
       throw new UnauthorizedException('User không tồn tại hoặc token không hợp lệ.');
    }
     // Kiểm tra xem email đã được xác thực chưa nếu cần thiết cho mọi route bảo vệ bằng JWT
    // if (!user.isEmailVerified) {
    //     throw new UnauthorizedException('Vui lòng xác thực email của bạn.');
    // }

     // Trả về object user (hoặc chỉ payload) để NestJS gắn vào request.user
     // Không nên trả về password
     const { password, ...result } = user;
     return result; // Chứa id, username, email, role,...
    // Hoặc chỉ cần trả về payload nếu không cần truy vấn DB lại:
    // return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}