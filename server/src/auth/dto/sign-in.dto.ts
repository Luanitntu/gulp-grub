import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
    @ApiProperty({ description: 'The username of the user', example: 'johndoe' })
    @IsNotEmpty({ message: 'Username không được để trống' })
    username: string;

    @ApiProperty({ description: 'The password of the user', example: '********' })
    @IsNotEmpty({ message: 'Password không được để trống' })
    password: string;
}
