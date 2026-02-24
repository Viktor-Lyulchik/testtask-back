import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

const mockProperty = {
  id: 1,
  title: 'Test Property',
  price: 6500000,
  ticket: 60000,
  yield: 9.25,
  daysLeft: 150,
  soldPercent: 75,
  imageUrl: null,
  createdAt: new Date(),
};

const mockApplication = {
  id: 1,
  userId: 1,
  propertyId: 1,
  amount: 60000,
  createdAt: new Date(),
  property: mockProperty,
};

const mockPrismaService = {
  property: {
    findUnique: jest.fn(),
  },
  application: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('successfully creates an application', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.application.create.mockResolvedValue(mockApplication);

      const result = await service.create(1, 1, 60000);

      expect(result).toEqual(mockApplication);
      expect(mockPrismaService.application.create).toHaveBeenCalledWith({
        data: { userId: 1, propertyId: 1, amount: 60000 },
        include: { property: true },
      });
    });

    it('accepts an amount that is a multiple of the ticket (2 tickets)', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.application.create.mockResolvedValue({
        ...mockApplication,
        amount: 120000,
      });

      const result = await service.create(1, 1, 120000);
      expect(result.amount).toBe(120000);
    });

    it('throws NotFoundException if property does not exist', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.create(1, 999, 60000)).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws BadRequestException if amount is less than the minimum', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);

      await expect(service.create(1, 1, 1000)).rejects.toThrow(
        BadRequestException
      );
    });

    it('throws BadRequestException if amount is not a multiple of the ticket', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);

      await expect(service.create(1, 1, 90000)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('findByUser', () => {
    it('returns a list of user applications with property', async () => {
      mockPrismaService.application.findMany.mockResolvedValue([
        mockApplication,
      ]);

      const result = await service.findByUser(1);

      expect(result).toEqual([mockApplication]);
      expect(mockPrismaService.application.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
        include: { property: true },
      });
    });

    it('returns an empty array if there are no applications', async () => {
      mockPrismaService.application.findMany.mockResolvedValue([]);

      const result = await service.findByUser(1);
      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    it('successfully removes own application', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(
        mockApplication
      );
      mockPrismaService.application.delete.mockResolvedValue(mockApplication);

      await expect(service.remove(1, 1)).resolves.not.toThrow();
      expect(mockPrismaService.application.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('throws NotFoundException if application does not exist', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.remove(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if application belongs to another user', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        ...mockApplication,
        userId: 2, // another user's application
      });

      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
