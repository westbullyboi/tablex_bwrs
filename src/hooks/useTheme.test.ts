import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("should return isDark as false when the dark class is absent", () => {
    document.documentElement.classList.remove("dark");

    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(false);
  });

  it("should return isDark as true when the dark class is present", () => {
    document.documentElement.classList.add("dark");

    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(true);
  });

  it("should update isDark when the dark class is toggled", async () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(false);

    // MutationObserver callbacks are delivered asynchronously (microtask).
    document.documentElement.classList.add("dark");
    await waitFor(() => expect(result.current.isDark).toBe(true));

    document.documentElement.classList.remove("dark");
    await waitFor(() => expect(result.current.isDark).toBe(false));
  });

  it("should stop observing after unmount", () => {
    const { result, unmount } = renderHook(() => useTheme());

    unmount();

    act(() => {
      document.documentElement.classList.add("dark");
    });

    // No update should have been applied after unmount.
    expect(result.current.isDark).toBe(false);
  });
});
