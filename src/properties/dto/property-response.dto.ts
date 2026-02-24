import { ApiProperty } from '@nestjs/swagger';

export class PropertyResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  ticket: number;

  @ApiProperty()
  yield: number;

  @ApiProperty()
  daysLeft: number;

  @ApiProperty()
  soldPercent: number;

  @ApiProperty({ required: false })
  imageUrl: string | null;

  @ApiProperty()
  createdAt: Date;
}
