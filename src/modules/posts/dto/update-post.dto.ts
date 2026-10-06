import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdatePostDto {
  @ApiProperty({ example: 'Tiêu đề mới', required: false })
  @IsString()
  @MinLength(5)
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Nội dung mới', required: false })
  @IsString()
  @MinLength(10)
  @IsOptional()
  content?: string;
}
