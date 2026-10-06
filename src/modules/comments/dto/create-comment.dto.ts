import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
    @ApiProperty({ example: 'Bình luận hay quá!' })
    @IsString()
    @MinLength(1)
    content: string;

    @ApiProperty({ example: 1, description: 'ID của người comment' })
    @IsNumber()
    userId: number;
}
