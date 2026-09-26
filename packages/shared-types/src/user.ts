import { z } from "zod";

export const UserRoleEnum = z.enum([
  "SUPER_ADMIN",
  "TEACHER",
  "HOMEROOM_TEACHER",
  "ADMIN",
  "MEMBER",
  "USER",
]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.string().optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type UserProfileDto = z.infer<typeof UserProfileSchema>;
