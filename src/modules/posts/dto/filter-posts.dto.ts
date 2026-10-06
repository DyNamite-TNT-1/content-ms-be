import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class DateRangeDto {
  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class FilterPostsDto {
  @ApiPropertyOptional({ example: 'nestjs' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  keyword?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ type: DateRangeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;
}
