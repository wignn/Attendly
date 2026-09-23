import { describe, it, expect } from "vitest";
import { RegisterRequestSchema, LoginRequestSchema } from "./auth";

describe("Shared Types Validation", () => {
  it("should validate valid register payload", () => {
    const payload = {
      email: "test@example.com",
      password: "password123",
      name: "John Doe",
      role: "USER" as const,
    };
    const result = RegisterRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email in register payload", () => {
    const payload = {
      email: "invalid-email",
      password: "password123",
      name: "John Doe",
    };
    const result = RegisterRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should reject short password in register payload", () => {
    const payload = {
      email: "test@example.com",
      password: "123",
      name: "John Doe",
    };
    const result = RegisterRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should validate valid login payload", () => {
    const payload = {
      email: "test@example.com",
      password: "password123",
    };
    const result = LoginRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject invalid login payload with missing password", () => {
    const payload = {
      email: "test@example.com",
      password: "",
    };
    const result = LoginRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
