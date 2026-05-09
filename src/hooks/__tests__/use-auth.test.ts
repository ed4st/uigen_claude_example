import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRouter } from "next/navigation";

vi.mock("next/navigation");
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));
vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));
vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

import { useAuth } from "../use-auth";
import { signIn, signUp } from "@/actions";
import { createProject } from "@/actions/create-project";
import { getProjects } from "@/actions/get-projects";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";

describe("useAuth", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("signIn", () => {
    it("should set loading state during sign in", async () => {
      vi.mocked(signIn).mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });
      vi.mocked(getAnonWorkData).mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.signIn("user@example.com", "password123");
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should call signIn action with email and password", async () => {
      vi.mocked(signIn).mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });
      vi.mocked(getAnonWorkData).mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(signIn).toHaveBeenCalledWith(
        "user@example.com",
        "password123"
      );
    });

    it("should return result when signIn fails", async () => {
      const errorResult = {
        success: false,
        error: "Invalid credentials",
      };
      vi.mocked(signIn).mockResolvedValue(errorResult);
      vi.mocked(getAnonWorkData).mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      let returnValue;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "wrong");
      });

      expect(returnValue).toEqual(errorResult);
    });

    it("should handle post-sign-in with anonymous work", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Create a button" }],
        fileSystemData: { "App.tsx": "export default () => <button/>" },
      };
      const project = { id: "project-1", name: "Design from 10:30:45 AM" };

      vi.mocked(signIn).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(anonWork);
      vi.mocked(createProject).mockResolvedValue(project as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });

      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });

    it("should navigate to most recent project when no anonymous work", async () => {
      const projects = [
        { id: "project-1", name: "Recent Project" },
        { id: "project-2", name: "Older Project" },
      ];

      vi.mocked(signIn).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue(
        projects as any
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(getProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });

    it("should create new project when user has no projects", async () => {
      const newProject = { id: "new-project", name: "New Design #12345" };

      vi.mocked(signIn).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue(
        newProject as any
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/New Design #\d+/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/new-project");
    });

    it("should set loading to false even when error occurs", async () => {
      vi.mocked(signIn).mockRejectedValue(
        new Error("Network error")
      );
      vi.mocked(getAnonWorkData).mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn("user@example.com", "password123");
        } catch {
          // Expected
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    it("should set loading state during sign up", async () => {
      vi.mocked(signUp).mockResolvedValue({
        success: false,
        error: "Email already registered",
      });
      vi.mocked(getAnonWorkData).mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.signUp("user@example.com", "password123");
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should call signUp action with email and password", async () => {
      vi.mocked(signUp).mockResolvedValue({
        success: false,
        error: "Email already registered",
      });
      vi.mocked(getAnonWorkData).mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("user@example.com", "password123");
      });

      expect(signUp).toHaveBeenCalledWith(
        "user@example.com",
        "password123"
      );
    });

    it("should return result when signUp fails", async () => {
      const errorResult = {
        success: false,
        error: "Password must be at least 8 characters",
      };
      vi.mocked(signUp).mockResolvedValue(errorResult);
      vi.mocked(getAnonWorkData).mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      let returnValue;
      await act(async () => {
        returnValue = await result.current.signUp("user@example.com", "short");
      });

      expect(returnValue).toEqual(errorResult);
    });

    it("should handle post-sign-up with anonymous work", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Make a card component" }],
        fileSystemData: { "Card.tsx": "export default () => <div/>" },
      };
      const project = { id: "project-new", name: "Design from 3:45:12 PM" };

      vi.mocked(signUp).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(anonWork);
      vi.mocked(createProject).mockResolvedValue(project as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });

      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-new");
    });

    it("should navigate to most recent project when no anonymous work", async () => {
      const projects = [
        { id: "existing-1", name: "Project One" },
      ];

      vi.mocked(signUp).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue(
        projects as any
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123");
      });

      expect(getProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-1");
    });

    it("should create new project when no projects exist", async () => {
      const newProject = { id: "fresh-project", name: "New Design #99999" };

      vi.mocked(signUp).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue(
        newProject as any
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/New Design #\d+/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/fresh-project");
    });

    it("should set loading to false even when error occurs", async () => {
      vi.mocked(signUp).mockRejectedValue(
        new Error("Database error")
      );
      vi.mocked(getAnonWorkData).mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signUp("user@example.com", "password123");
        } catch {
          // Expected
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should not navigate when signIn returns failure without calling post-sign-in logic", async () => {
      vi.mocked(signIn).mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "wrong");
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
      expect(getProjects).not.toHaveBeenCalled();
    });

    it("should not navigate when signUp returns failure without calling post-sign-up logic", async () => {
      vi.mocked(signUp).mockResolvedValue({
        success: false,
        error: "Email already registered",
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("taken@example.com", "password123");
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
      expect(getProjects).not.toHaveBeenCalled();
    });

    it("should handle empty anonymous work (no messages)", async () => {
      const anonWork = {
        messages: [],
        fileSystemData: { "index.tsx": "" },
      };

      vi.mocked(signIn).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(anonWork);
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({
        id: "new",
      } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(getProjects).toHaveBeenCalled();
    });

    it("should return success result when signIn succeeds", async () => {
      const successResult = { success: true };
      vi.mocked(signIn).mockResolvedValue(successResult);
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({
        id: "proj-1",
      } as any);

      const { result } = renderHook(() => useAuth());

      let returnValue;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "pass");
      });

      expect(returnValue).toEqual(successResult);
    });

    it("should return success result when signUp succeeds", async () => {
      const successResult = { success: true };
      vi.mocked(signUp).mockResolvedValue(successResult);
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({
        id: "proj-1",
      } as any);

      const { result } = renderHook(() => useAuth());

      let returnValue;
      await act(async () => {
        returnValue = await result.current.signUp("user@example.com", "pass");
      });

      expect(returnValue).toEqual(successResult);
    });

    it("should handle multiple sequential calls", async () => {
      vi.mocked(signIn).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([
        { id: "proj-1" },
      ] as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user1@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledTimes(1);

      mockPush.mockClear();
      vi.mocked(getProjects).mockResolvedValue([
        { id: "proj-2" },
      ] as any);

      await act(async () => {
        await result.current.signIn("user2@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/proj-2");
    });
  });

  describe("hook return value", () => {
    it("should return signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signUp");
      expect(result.current).toHaveProperty("isLoading");

      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });

    it("should have isLoading as false initially", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
    });
  });
});
