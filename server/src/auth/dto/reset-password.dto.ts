import { IsNotEmpty, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @IsNotEmpty()
    @IsUUID()
    token: string;

    @ApiProperty({
        description: 'New password',
        example: 'newpassword123',
        minLength: 8
    })
    @IsNotEmpty({ message: 'Password mới không được để trống' })
    @MinLength(8, { message: 'Password phải có ít nhất 8 ký tự' })
    newPassword: string;
}
