import { SetMetadata } from '@nestjs/common';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
