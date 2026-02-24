import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

const mockApplication = {
  id: 1,
  userId: 1,
  propertyId: 1,
  amount: 60000,
  createdAt: new Date(),
};

const mockApplicationsService = {
  create: jest.fn().mockResolvedValue(mockApplication),
  findByUser: jest.fn().mockResolvedValue([mockApplication]),
  remove: jest.fn().mockResolvedValue(undefined),
};

const mockRequest = { user: { id: 1, email: 'test@test.com' } } as any;

describe('ApplicationsController', () => {
  let controller: ApplicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        { provide: ApplicationsService, useValue: mockApplicationsService },
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create — call service.create with userId from request', async () => {
    const result = await controller.create(mockRequest, {
      propertyId: 1,
      amount: 60000,
    });

    expect(mockApplicationsService.create).toHaveBeenCalledWith(1, 1, 60000);
    expect(result).toEqual(mockApplication);
  });

  it('get — return applications of the current user', async () => {
    const result = await controller.get(mockRequest);

    expect(mockApplicationsService.findByUser).toHaveBeenCalledWith(1);
    expect(result).toEqual([mockApplication]);
  });

  it('remove — call service.remove with userId and id', async () => {
    await controller.remove(mockRequest, 1);

    expect(mockApplicationsService.remove).toHaveBeenCalledWith(1, 1);
  });
});
