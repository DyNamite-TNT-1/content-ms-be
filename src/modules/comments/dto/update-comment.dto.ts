import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCommentDto {
    @ApiProperty({ example: 'Nội dung mới', required: false })
    @IsString()
    @MinLength(1)
    @IsOptional()
    content?: string;
}
