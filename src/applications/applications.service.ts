import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, propertyId: number, amount: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property with id ${propertyId} not found`);
    }

    if (amount < property.ticket) {
      throw new BadRequestException(
        `Minimum investment is ${property.ticket} Dhs`
      );
    }

    if (amount % property.ticket !== 0) {
      throw new BadRequestException(
        `Amount must be a multiple of the ticket size (${property.ticket} Dhs)`
      );
    }

    return this.prisma.application.create({
      data: { userId, propertyId, amount },
      include: { property: true },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { property: true },
    });
  }

  async remove(userId: number, applicationId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.userId !== userId) {
      throw new ForbiddenException('You can only delete your own applications');
    }

    await this.prisma.application.delete({ where: { id: applicationId } });
  }
}
