import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MinLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Tiêu đề bài viết' })
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({ example: 'Nội dung bài viết...' })
  @IsString()
  @MinLength(10)
  content: string;

  @ApiProperty({ example: 1, description: 'ID của tác giả' })
  @IsNumber()
  authorId: number;
}
