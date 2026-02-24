import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';

const mockAuthResponse = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: { id: 1, email: 'test@test.com', role: Role.USER },
};

const mockAuthService = {
  register: jest.fn().mockResolvedValue(mockAuthResponse),
  login: jest.fn().mockResolvedValue(mockAuthResponse),
  refresh: jest.fn().mockResolvedValue(mockAuthResponse),
  logout: jest.fn().mockResolvedValue(undefined),
  logoutAll: jest.fn().mockResolvedValue(undefined),
  getMe: jest.fn().mockResolvedValue({ user: mockAuthResponse.user }),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register — calls authService.register and returns tokens', async () => {
    const result = await controller.register({
      email: 'test@test.com',
      password: 'password123',
    });

    expect(mockAuthService.register).toHaveBeenCalledWith(
      'test@test.com',
      'password123'
    );
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('login — calls authService.login and returns tokens', async () => {
    const result = await controller.login({
      email: 'test@test.com',
      password: 'password123',
    });

    expect(mockAuthService.login).toHaveBeenCalledWith(
      'test@test.com',
      'password123'
    );
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('refresh — calls authService.refresh', async () => {
    const result = await controller.refresh({ refreshToken: 'old-token' });

    expect(mockAuthService.refresh).toHaveBeenCalledWith('old-token');
    expect(result).toHaveProperty('accessToken');
  });

  it('logout — calls authService.logout', async () => {
    await controller.logout({ refreshToken: 'some-token' });
    expect(mockAuthService.logout).toHaveBeenCalledWith('some-token');
  });
});
