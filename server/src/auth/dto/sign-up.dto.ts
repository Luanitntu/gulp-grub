import {
    IsEmail,
    IsNotEmpty,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
    @ApiProperty({
        description: 'The username',
        maxLength: 50,
        example: 'john_doe'
    })
    @IsNotEmpty({ message: 'Username không được để trống' })
    @MaxLength(50)
    username: string;

    @ApiProperty({
        description: 'The password',
        minLength: 8,
        example: 'StrongPass123'
    })
    @IsNotEmpty({ message: 'Password không được để trống' })
    @MinLength(8, { message: 'Password phải có ít nhất 8 ký tự' })
    password: string;

    @ApiProperty({
        description: 'The email address',
        maxLength: 100,
        example: 'john@example.com'
    })
    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @MaxLength(100)
    email: string;
}
