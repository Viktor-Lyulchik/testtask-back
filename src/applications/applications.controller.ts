import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationResponseDto } from './dto/application-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: number; email: string };
}

@ApiTags('Applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Post()
  @ApiCreatedResponse({ type: ApplicationResponseDto })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(
      req.user.id,
      dto.propertyId,
      dto.amount
    );
  }

  @Get()
  @ApiOkResponse({ type: [ApplicationResponseDto] })
  get(@Req() req: AuthenticatedRequest) {
    return this.applicationsService.findByUser(req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Application deleted' })
  @ApiNotFoundResponse({ description: 'Application not found or not yours' })
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.applicationsService.remove(req.user.id, id);
  }
}
