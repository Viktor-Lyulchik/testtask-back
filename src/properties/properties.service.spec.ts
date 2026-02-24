import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesService } from './properties.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  property: {
    findMany: jest.fn(),
  },
};

const mockProperties = [
  {
    id: 1,
    title: 'The Marina Torch',
    price: 6500000,
    ticket: 60000,
    yield: 9.25,
    daysLeft: 150,
    soldPercent: 75,
    imageUrl: 'https://example.com/image1.jpg',
    createdAt: new Date(),
  },
  {
    id: 2,
    title: 'HHHR Tower',
    price: 6500000,
    ticket: 60000,
    yield: 9.25,
    daysLeft: 150,
    soldPercent: 75,
    imageUrl: 'https://example.com/image2.jpg',
    createdAt: new Date(),
  },
];

describe('PropertiesService', () => {
  let service: PropertiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns a list of all properties', async () => {
      mockPrismaService.property.findMany.mockResolvedValue(mockProperties);

      const result = await service.findAll();

      expect(result).toEqual(mockProperties);
      expect(mockPrismaService.property.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns an empty array if no properties are found', async () => {
      mockPrismaService.property.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});
