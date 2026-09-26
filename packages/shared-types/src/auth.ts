import { z } from "zod";
import { UserProfileSchema } from "./user";

export const LoginRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(1, { message: "Password is required" }),
});
export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

export const AuthTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.literal("Bearer"),
  expires_in: z.number(),
  user: UserProfileSchema,
});
export type AuthTokenResponseDto = z.infer<typeof AuthTokenResponseSchema>;
