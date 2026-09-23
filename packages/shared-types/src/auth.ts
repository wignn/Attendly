import { z } from "zod";
import { UserProfileSchema, UserRoleEnum } from "./user";

export const RegisterRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  role: UserRoleEnum.optional().default("USER"),
});
export type RegisterRequestDto = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(1, { message: "Password is required" }),
});
export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

export const AuthTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  user: UserProfileSchema,
});
export type AuthTokenResponseDto = z.infer<typeof AuthTokenResponseSchema>;
