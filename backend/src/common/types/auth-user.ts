import { RoleCode } from '@prisma/client';

export interface AuthUser {
  userId: string;
  merchantId: string | null;
  role: RoleCode;
  username: string;
}
