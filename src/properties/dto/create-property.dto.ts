import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePropertyDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  price: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ticket: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  yield: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  daysLeft: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  soldPercent: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
