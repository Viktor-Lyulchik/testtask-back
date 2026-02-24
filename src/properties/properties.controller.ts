import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiOkResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { PropertyResponseDto } from './dto/property-response.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Get()
  @ApiOkResponse({ type: [PropertyResponseDto] })
  findAll() {
    return this.propertiesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        price: { type: 'number' },
        ticket: { type: 'number' },
        yield: { type: 'number' },
        daysLeft: { type: 'number' },
        soldPercent: { type: 'number' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: PropertyResponseDto })
  async create(
    @Body() dto: CreatePropertyDto,
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined
  ) {
    let imageUrl: string | undefined;

    if (file) {
      imageUrl = await this.cloudinaryService.uploadImage(file);
    }

    return this.propertiesService.create(dto, imageUrl);
  }
}
