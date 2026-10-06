import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'a@example.com' })
  @IsEmail()
  email: string;
}
