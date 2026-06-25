// KEEP IN SYNC WITH API (src/modules/users/schemas/user.schema.ts)
import { z } from 'zod';

export const UserRoleEnum = z.enum(['superadmin', 'admin', 'staff', 'service']);

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: UserRoleEnum.default('staff').optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: UserRoleEnum.optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UserRole = z.infer<typeof UserRoleEnum>;

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
