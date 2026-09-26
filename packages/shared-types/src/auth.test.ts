import { describe, it, expect } from "vitest";
import { AuthTokenResponseSchema, LoginRequestSchema } from "./auth";
import { UserProfileSchema } from "./user";

describe("Shared Types Validation", () => {
  it("should validate an API login payload", () => {
    const result = LoginRequestSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject login payload with missing password", () => {
    const result = LoginRequestSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("should validate the API current-user role contract", () => {
    const result = UserProfileSchema.safeParse({
      id: "00000000-0000-4000-8000-000000000000",
      email: "teacher@example.com",
      name: "Teacher",
      roles: ["TEACHER", "HOMEROOM_TEACHER"],
      permissions: ["attendance:read"],
    });
    expect(result.success).toBe(true);
  });

  it("should validate an auth token response", () => {
    const result = AuthTokenResponseSchema.safeParse({
      access_token: "access",
      refresh_token: "refresh",
      token_type: "Bearer",
      expires_in: 900,
      user: {
        id: "00000000-0000-4000-8000-000000000000",
        email: "teacher@example.com",
        name: "Teacher",
        roles: ["TEACHER"],
        permissions: ["attendance:read"],
      },
    });
    expect(result.success).toBe(true);
  });
});
