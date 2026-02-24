import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  // ─── Token helpers ────────────────────────────────────────────────

  private signAccess(userId: number, email: string, role: Role): string {
    return this.jwt.sign(
      { sub: userId, email, role },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }
    );
  }

  /** Generate a cryptographically random opaque refresh token string */
  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /** Hash refresh token before storing (so a DB leak doesn't expose tokens) */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Persist a new refresh token; also cleans up any expired ones for the user */
  private async saveRefreshToken(userId: number, token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.$transaction([
      // Remove expired tokens for this user (housekeeping)
      this.prisma.refreshToken.deleteMany({
        where: { userId, expiresAt: { lt: new Date() } },
      }),
      // Store new token hash
      this.prisma.refreshToken.create({
        data: { userId, tokenHash, expiresAt },
      }),
    ]);
  }

  private async buildAuthResponse(userId: number, email: string, role: Role) {
    const accessToken = this.signAccess(userId, email, role);
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(userId, refreshToken);
    return { accessToken, refreshToken, user: { id: userId, email, role } };
  }

  // ─── Public methods ───────────────────────────────────────────────

  async register(email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.users.createUser(email, passwordHash);
    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  /**
   * Rotate refresh token: validate old one, delete it, issue a new pair.
   * This means a stolen refresh token can only be used once before
   * the legitimate user's next refresh invalidates it.
   */
  async refresh(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      // Clean up expired token
      await this.prisma.refreshToken.delete({ where: { tokenHash } });
      throw new UnauthorizedException(
        'Refresh token expired, please log in again'
      );
    }

    // Delete the used token (rotation — each refresh token is single-use)
    await this.prisma.refreshToken.delete({ where: { tokenHash } });

    return this.buildAuthResponse(
      stored.user.id,
      stored.user.email,
      stored.user.role
    );
  }

  /** Logout: invalidate a specific refresh token */
  async logout(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    // Silently ignore if token doesn't exist (already logged out)
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  /** Logout from all devices: delete all refresh tokens for user */
  async logoutAll(userId: number): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async getMe(userId: number) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }
}
