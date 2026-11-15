import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearMemberDevice, isRecognizedMemberDevice, rememberMemberDevice } from "@/lib/memberDevice";

describe("device-local member recognition", () => {
  beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });

  it("does not recognize a new device", () => {
    expect(isRecognizedMemberDevice()).toBe(false);
  });

  it("persists across browser sessions without storing member identity", () => {
    rememberMemberDevice();
    sessionStorage.clear();
    expect(isRecognizedMemberDevice()).toBe(true);
    expect(localStorage.length).toBe(1);
    expect(localStorage.getItem("m2f-member-device")).toBe("1");
  });

  it("lets members clear only recognition, not their session or other preferences", () => {
    localStorage.setItem("other-preference", "keep");
    rememberMemberDevice();
    expect(clearMemberDevice()).toBe(true);
    expect(isRecognizedMemberDevice()).toBe(false);
    expect(localStorage.getItem("other-preference")).toBe("keep");
  });

  it("falls back safely when browser storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(() => rememberMemberDevice()).not.toThrow();
    expect(isRecognizedMemberDevice()).toBe(false);
    expect(clearMemberDevice()).toBe(false);
  });
});