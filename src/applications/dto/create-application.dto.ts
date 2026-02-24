import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty()
  @IsInt()
  propertyId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  amount: number;
}
