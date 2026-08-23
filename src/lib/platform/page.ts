import { getRuntime, type PlatformRuntime } from "./runtime";

export function tryRuntime(): PlatformRuntime | null {
  try {
    return getRuntime();
  } catch {
    return null;
  }
}
