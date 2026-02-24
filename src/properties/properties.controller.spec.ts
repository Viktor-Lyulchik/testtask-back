import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const mockProperties = [
  {
    id: 1,
    title: 'The Marina Torch',
    price: 6500000,
    ticket: 60000,
    yield: 9.25,
    daysLeft: 150,
    soldPercent: 75,
    imageUrl: null,
    createdAt: new Date(),
  },
];

const mockPropertiesService = {
  findAll: jest.fn().mockResolvedValue(mockProperties),
  create: jest.fn().mockResolvedValue(mockProperties[0]),
};

const mockCloudinaryService = {
  uploadImage: jest.fn().mockResolvedValue('https://cloudinary.com/image.jpg'),
};

describe('PropertiesController', () => {
  let controller: PropertiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        { provide: PropertiesService, useValue: mockPropertiesService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll — returns a list of properties', async () => {
    const result = await controller.findAll();

    expect(mockPropertiesService.findAll).toHaveBeenCalled();
    expect(result).toEqual(mockProperties);
  });
});
