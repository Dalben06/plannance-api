import { describe, expect, it, vi } from "vitest";
import { createUserSettingsService } from "../../../src/application/services/userSettingsService.js";
import type { UserSettingsRepository } from "../../../src/application/ports/userSettingsRepository.js";
import type { UserSettings } from "../../../src/domain/userSettings.js";

const sampleSettings: UserSettings = {
  id: "1",
  userId: "user-123",
  phoneNumber: "+1234567890",
  isDarkMode: true,
  notifyByEmail: false,
  notifyByMessage: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const buildMockRepository = (): UserSettingsRepository => ({
  findByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
});

describe("UserSettingsService", () => {
  describe("getByUserId", () => {
    it("returns settings when found", async () => {
      const repository = buildMockRepository();
      vi.mocked(repository.findByUserId).mockResolvedValue(sampleSettings);
      const service = createUserSettingsService(repository);

      const result = await service.getByUserId("user-123");

      expect(result).toEqual(sampleSettings);
      expect(repository.findByUserId).toHaveBeenCalledWith("user-123");
    });

    it("returns null when not found", async () => {
      const repository = buildMockRepository();
      vi.mocked(repository.findByUserId).mockResolvedValue(null);
      const service = createUserSettingsService(repository);

      const result = await service.getByUserId("user-123");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("passes correct input to repository and returns result", async () => {
      const repository = buildMockRepository();
      vi.mocked(repository.create).mockResolvedValue(sampleSettings);
      const service = createUserSettingsService(repository);

      const input = {
        userId: "user-123",
        phoneNumber: "+1234567890",
        isDarkMode: true,
        notifyByEmail: false,
        notifyByMessage: false,
      };
      const result = await service.create(input);

      expect(result).toEqual(sampleSettings);
      expect(repository.create).toHaveBeenCalledWith(input);
    });
  });

  describe("update", () => {
    it("passes correct userId and input to repository and returns result", async () => {
      const updated: UserSettings = { ...sampleSettings, isDarkMode: false, notifyByEmail: true };
      const repository = buildMockRepository();
      vi.mocked(repository.update).mockResolvedValue(updated);
      const service = createUserSettingsService(repository);

      const input = {
        phoneNumber: "+1234567890",
        isDarkMode: false,
        notifyByEmail: true,
        notifyByMessage: false,
      };
      const result = await service.update("user-123", input);

      expect(result).toEqual(updated);
      expect(repository.update).toHaveBeenCalledWith("user-123", input);
    });

    it("returns null when settings not found", async () => {
      const repository = buildMockRepository();
      vi.mocked(repository.update).mockResolvedValue(null);
      const service = createUserSettingsService(repository);

      const result = await service.update("user-123", {
        phoneNumber: "+1234567890",
        isDarkMode: false,
        notifyByEmail: false,
        notifyByMessage: false,
      });

      expect(result).toBeNull();
    });
  });
});
