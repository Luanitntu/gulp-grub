import { SignUpDto } from '../../auth/dto/sign-up.dto';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto extends SignUpDto {
  role?: UserRole; // Role will be set default in entity or logic service
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
}
