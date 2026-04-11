import { describe, expect, it, vi } from "vitest";
import { createUserPlanService } from "../../../src/application/services/userPlanService.js";
import type { UserPlanRepository } from "../../../src/application/ports/userPlanRepository.js";
import type { UserPlan, UserPlanCreate, UserPlanUpdate } from "../../../src/domain/userPlan.js";

const samplePlan: UserPlan = {
  id: "1",
  userId: "user-123",
  budget: 1500,
  reminderImportRegister: true,
  notifyFixedEventOnDay: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const buildMockRepository = (): UserPlanRepository => ({
  getByUserId: vi.fn(),
  create: vi.fn(),
  upsert: vi.fn(),
});

describe("UserPlanService", () => {
  describe("getPlan", () => {
    it("returns the plan when found", async () => {
      const repo = buildMockRepository();
      vi.mocked(repo.getByUserId).mockResolvedValue(samplePlan);
      const service = createUserPlanService(repo);

      const result = await service.getPlan("user-123");

      expect(result).toEqual(samplePlan);
      expect(repo.getByUserId).toHaveBeenCalledWith("user-123");
    });

    it("returns null when no plan exists for the user", async () => {
      const repo = buildMockRepository();
      vi.mocked(repo.getByUserId).mockResolvedValue(null);
      const service = createUserPlanService(repo);

      const result = await service.getPlan("user-123");

      expect(result).toBeNull();
    });
  });

  describe("createPlan", () => {
    it("creates and returns the new plan", async () => {
      const repo = buildMockRepository();
      vi.mocked(repo.create).mockResolvedValue(samplePlan);
      const service = createUserPlanService(repo);

      const input: UserPlanCreate = {
        userId: "user-123",
        budget: 1500,
        reminderImportRegister: true,
        notifyFixedEventOnDay: false,
      };
      const result = await service.createPlan(input);

      expect(result).toEqual(samplePlan);
      expect(repo.create).toHaveBeenCalledWith(input);
    });

    it("passes through budget of 0", async () => {
      const repo = buildMockRepository();
      const zeroBudgetPlan = { ...samplePlan, budget: 0 };
      vi.mocked(repo.create).mockResolvedValue(zeroBudgetPlan);
      const service = createUserPlanService(repo);

      const input: UserPlanCreate = {
        userId: "user-123",
        budget: 0,
        reminderImportRegister: false,
        notifyFixedEventOnDay: true,
      };
      const result = await service.createPlan(input);

      expect(result.budget).toBe(0);
      expect(repo.create).toHaveBeenCalledWith(input);
    });
  });

  describe("upsertPlan", () => {
    it("calls repository upsert with correct args and returns result when plan exists", async () => {
      const repo = buildMockRepository();
      const updatedPlan = { ...samplePlan, budget: 2000 };
      vi.mocked(repo.getByUserId).mockResolvedValue(samplePlan);
      vi.mocked(repo.upsert).mockResolvedValue(updatedPlan);
      const service = createUserPlanService(repo);

      const input: UserPlanUpdate = {
        budget: 2000,
        reminderImportRegister: true,
        notifyFixedEventOnDay: false,
      };
      const result = await service.upsertPlan("user-123", input);

      expect(result).toEqual(updatedPlan);
      expect(repo.upsert).toHaveBeenCalledWith("1", "user-123", input);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it("creates a new plan when record does not exist", async () => {
      const repo = buildMockRepository();
      const newPlan = { ...samplePlan, id: "99" };
      vi.mocked(repo.getByUserId).mockResolvedValue(null);
      vi.mocked(repo.create).mockResolvedValue(newPlan);
      const service = createUserPlanService(repo);

      const input: UserPlanUpdate = {
        budget: 500,
        reminderImportRegister: false,
        notifyFixedEventOnDay: true,
      };
      const result = await service.upsertPlan("user-123", input);

      expect(result).toEqual(newPlan);
      expect(repo.create).toHaveBeenCalledWith({ ...input, userId: "user-123" });
      expect(repo.upsert).not.toHaveBeenCalled();
    });
  });
});
