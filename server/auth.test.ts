import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./auth";

describe("Authentication", () => {
  describe("Password Hashing", () => {
    it("should hash a password", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should verify a correct password", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const password = "TestPassword123!";
      const wrongPassword = "WrongPassword456!";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it("should produce different hashes for the same password", async () => {
      const password = "TestPassword123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      // But both should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe("Password Requirements", () => {
    it("should accept strong passwords", async () => {
      const strongPasswords = [
        "StrongPass123!",
        "MyPassword@2026",
        "Secure#Pass999",
        "ValidPass$2026",
      ];

      for (const password of strongPasswords) {
        const hash = await hashPassword(password);
        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);
      }
    });

    it("should handle special characters in passwords", async () => {
      const password = "P@ssw0rd!#$%^&*()";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should handle unicode characters in passwords", async () => {
      const password = "Sênha@2026Açúcar";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });
  });
});
