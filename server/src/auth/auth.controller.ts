import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public() // No need JWT for this route
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body(new ValidationPipe()) signUpDto: SignUpDto) {
    const user = await this.authService.signUp(signUpDto);
    const {
      password,
      emailVerificationToken,
      passwordResetToken,
      passwordResetExpires,
      ...result
    } = user;
    return {
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.',
      user: result,
    };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Request() req) {
    console.log(
      'SignIn Controller: User authenticated by LocalAuthGuard:',
      req.user,
    );
    return this.authService.signIn(req.user);
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token xác thực là bắt buộc.');
    }
    const success = await this.authService.verifyEmail(token);
    if (success) {
      return { message: 'Xác thực email thành công!' };
    } else {
      throw new InternalServerErrorException('Xác thực email thất bại.');
    }
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ValidationPipe()) forgotPasswordDto: ForgotPasswordDto,
  ) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message:
        'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ValidationPipe()) resetPasswordDto: ResetPasswordDto,
  ) {
    const success = await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    if (success) {
      return { message: 'Đặt lại mật khẩu thành công!' };
    } else {
      throw new InternalServerErrorException('Đặt lại mật khẩu thất bại.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
