import { z } from "zod";

export const UserRoleEnum = z.enum(["ADMIN", "MEMBER", "USER"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: UserRoleEnum,
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserProfileDto = z.infer<typeof UserProfileSchema>;
