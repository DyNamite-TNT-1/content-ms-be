import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Nguyen Van B' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'b@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
