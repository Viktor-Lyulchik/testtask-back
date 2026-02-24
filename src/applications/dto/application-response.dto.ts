import { ApiProperty } from '@nestjs/swagger';
import { PropertyResponseDto } from '../../properties/dto/property-response.dto';

export class ApplicationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  propertyId: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => PropertyResponseDto })
  property: PropertyResponseDto;
}
