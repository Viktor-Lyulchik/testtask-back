import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreatePropertyDto, imageUrl?: string) {
    return this.prisma.property.create({
      data: {
        title: dto.title,
        price: dto.price,
        ticket: dto.ticket,
        yield: dto.yield,
        daysLeft: dto.daysLeft,
        soldPercent: dto.soldPercent,
        imageUrl: imageUrl ?? null,
      },
    });
  }
}
