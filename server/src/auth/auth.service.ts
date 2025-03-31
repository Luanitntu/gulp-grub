import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { User, UserRole } from '../users/entities/user.entity';
import * as crypto from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  // Được gọi bởi LocalStrategy
  async validateUser(username: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findOneByUsername(username);
    if (user && (await user.validatePassword(pass))) {
      // if check email is verified is needed
      // if (!user.isEmailVerified) {
      //   throw new UnauthorizedException('Vui lòng xác thực email trước khi đăng nhập.');
      // }
      return user;
    }
    return null;
  }

  async signIn(user: Omit<User, 'password'>): Promise<{ accessToken: string }> {
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async signUp(signUpDto: SignUpDto): Promise<User> {
    const { username, email, password } = signUpDto;

    // 1. check username and email is exist
    const existingUserByUsername =
      await this.usersService.findOneByUsername(username);
    if (existingUserByUsername) {
      throw new ConflictException('Username đã tồn tại');
    }
    const existingUserByEmail = await this.usersService.findOneByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('Email đã tồn tại');
    }

    // 2. create token for email verification
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // 3. create new user (password will be hashed by hook in entity)
    const userToCreate: CreateUserDto = {
      username,
      email,
      password,
      role: UserRole.USER, // default role
      isEmailVerified: false,
      emailVerificationToken: emailVerificationToken,
    };
    const newUser = await this.usersService.create(userToCreate);

    // 4. send email verification
    const verificationUrl = `<span class="math-inline">\{this\.configService\.get<string\>\('FRONTEND\_URL'\)\}/verify\-email?token\=</span>{emailVerificationToken}`;
    try {
      await this.mailerService.sendMail({
        to: newUser.email,
        subject: 'Chào mừng bạn! Vui lòng xác thực email',
        text: `Chào ${newUser.username}, cảm ơn bạn đã đăng ký. Vui lòng click vào link sau để xác thực email: ${verificationUrl}`,
        // if use template:
        // template: './email-verification',
        // context: {
        //   name: newUser.username,
        //   url: verificationUrl,
        // },
      });
    } catch (error) {
      console.error('Gửi email xác thực thất bại:', error);
      // Có thể muốn xử lý lỗi ở đây (ví dụ: xóa user vừa tạo hoặc đánh dấu cần gửi lại?)
      // throw new InternalServerErrorException('Không thể gửi email xác thực.');
    }
    // no return newUser here, because we don't want to expose password and token to client
    const { password: _, emailVerificationToken: __, ...result } = newUser;
    return result as User;
  }

  // verify email
  async verifyEmail(token: string): Promise<boolean> {
    const user = await this.usersService.findByEmailVerificationToken(token);
    if (!user) {
      throw new NotFoundException(
        'Token xác thực không hợp lệ hoặc đã hết hạn.',
      );
    }

    // upate status and clear token
    await this.usersService.updateUser(user.id, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
    });

    return true;
  }

  // forget password
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      console.warn(`Yêu cầu reset password cho email không tồn tại: ${email}`);
      return;
    }
    // create token reset and expire time
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // expire in 1 hour

    // Save token and expire time to user
    await this.usersService.updateUser(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // send email with reset link
    const resetUrl = `<span class="math-inline">\{this\.configService\.get<string\>\('FRONTEND\_URL'\)\}/reset\-password?token\=</span>{resetToken}`;
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Yêu cầu đặt lại mật khẩu',
        text:
          `Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\n` +
          `Vui lòng click vào link sau hoặc dán vào trình duyệt để hoàn tất quá trình (link có hiệu lực trong 1 giờ):\n\n` +
          `${resetUrl}\n\n` +
          `Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.\n`,
        // template: './password-reset',
        // context: { name: user.username, url: resetUrl },
      });
    } catch (error) {
      console.error('Gửi email reset password thất bại:', error);
      throw new InternalServerErrorException(
        'Không thể gửi email đặt lại mật khẩu.',
      );
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.usersService.findByPasswordResetToken(token);

    if (!user) {
      throw new BadRequestException('Token đặt lại mật khẩu không hợp lệ.');
    }

    // check token expired
    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      //delete token and expire time before throw error
      await this.usersService.updateUser(user.id, {
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      });
      throw new BadRequestException('Token đặt lại mật khẩu đã hết hạn.');
    }

    // update password and clear token and expire time
    await this.usersService.updateUser(user.id, {
      password: newPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    // send email notification to user (optional)
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Mật khẩu của bạn đã được thay đổi',
        text: `Chào ${user.username}, mật khẩu cho tài khoản của bạn vừa được thay đổi thành công. Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ hỗ trợ ngay lập tức.`,
      });
    } catch (error) {
      console.error('Gửi email thông báo đổi MK thất bại:', error);
    }

    return true;
  }
}
