import { getRuntime, runtimeForOrg, type PlatformRuntime } from "./runtime";

export function tryRuntime(orgRef?: string | null): PlatformRuntime | null {
  try {
    return orgRef ? runtimeForOrg(orgRef) : getRuntime();
  } catch {
    return null;
  }
}
