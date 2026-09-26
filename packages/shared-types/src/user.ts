import { z } from "zod";

export const UserRoleEnum = z.enum(["SUPER_ADMIN", "TEACHER", "HOMEROOM_TEACHER"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  roles: z.array(UserRoleEnum).optional(),
  permissions: z.array(z.string()).optional(),
});

export type UserProfileDto = z.infer<typeof UserProfileSchema>;
