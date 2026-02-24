import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

const mockUser = {
  id: 1,
  email: 'test@test.com',
  password: '',
  role: Role.USER,
  createdAt: new Date(),
};

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  createUser: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-access-token'),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('mock-secret'),
};

const mockPrismaService = {
  refreshToken: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest
    .fn()
    .mockImplementation((ops: unknown[]) => Promise.all(ops)),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('successfully registers a new user and returns tokens', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(mockUser);

      const result = await service.register('test@test.com', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toMatchObject({ id: 1, email: 'test@test.com' });
    });

    it('throws ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register('test@test.com', 'password123')
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('successfully logs in a user with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.login('test@test.com', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toMatchObject({ id: 1, email: 'test@test.com' });
    });

    it('throws UnauthorizedException if user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('notfound@test.com', 'password123')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      await expect(
        service.login('test@test.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('successfully rotates refresh token and returns a new pair', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        tokenHash: 'hash',
        userId: 1,
        expiresAt: new Date(Date.now() + 86400000), // tomorrow
        user: mockUser,
      });
      mockPrismaService.refreshToken.delete.mockResolvedValue({});

      const result = await service.refresh('valid-raw-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      // Old token is deleted (rotation)
      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledTimes(1);
    });

    it('throws UnauthorizedException if token is not found', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('throws UnauthorizedException if token is expired', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        tokenHash: 'hash',
        userId: 1,
        expiresAt: new Date(Date.now() - 1000), // yesterday
        user: mockUser,
      });
      mockPrismaService.refreshToken.delete.mockResolvedValue({});

      await expect(service.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('getMe', () => {
    it('returns fresh user data from the database', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.getMe(1);

      expect(result.user).toMatchObject({
        id: 1,
        email: 'test@test.com',
        role: Role.USER,
      });
    });

    it('throws NotFoundException if user does not exist', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.getMe(999)).rejects.toThrow(NotFoundException);
    });
  });
});
