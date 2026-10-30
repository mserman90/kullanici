import { describe, it, expect } from "vitest";
import { normalizeName, generateUsernames } from "@/utils/usernameGenerator";

describe("usernameGenerator", () => {
  describe("normalizeName", () => {
    it("should transliterate Turkish characters to ASCII", () => {
      expect(normalizeName("Çağlar")).toBe("caglar");
      expect(normalizeName("Özlem")).toBe("ozlem");
      expect(normalizeName("Şükrü")).toBe("sukru");
      expect(normalizeName("İsmet")).toBe("ismet");
      expect(normalizeName("Ilgın")).toBe("ilgin");
    });

    it("should strip non-alphanumeric characters and trim", () => {
      expect(normalizeName("  John-Doe!  ")).toBe("johndoe");
      expect(normalizeName("O'Connor")).toBe("oconnor");
    });
  });

  describe("generateUsernames", () => {
    it("should generate common username variations", () => {
      const variations = generateUsernames("John", "Doe");
      expect(variations).toContain("johndoe");
      expect(variations).toContain("john.doe");
      expect(variations).toContain("john_doe");
      expect(variations).toContain("john-doe");
      expect(variations).toContain("jdoe");
      expect(variations).toContain("j.doe");
      expect(variations).toContain("johnd");
      expect(variations).toContain("doejohn");
      expect(variations.length).toBeGreaterThan(15);
    });

    it("should handle Turkish names properly", () => {
      const variations = generateUsernames("Ömer", "Şahin");
      expect(variations).toContain("omersahin");
      expect(variations).toContain("osahin");
      expect(variations).toContain("omer.sahin");
      // All usernames should be valid ASCII characters
      for (const u of variations) {
        expect(u).toMatch(/^[a-z0-9._-]+$/);
      }
    });

    it("should return empty array for empty inputs", () => {
      expect(generateUsernames("", "Doe")).toEqual([]);
      expect(generateUsernames("John", "")).toEqual([]);
      expect(generateUsernames("", "")).toEqual([]);
    });
  });
});
