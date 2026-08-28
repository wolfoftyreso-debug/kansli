import { ApiError } from "@pixdrift/api-core";
import { isHouseSession } from "../kansli/intakes.ts";

/** MAJ alpha: house tenants only. Workshops see the room, not the product. */
export function majIsOpen(orgRef: string | null | undefined): boolean {
  return isHouseSession(orgRef);
}

export function requireMajHouse(orgRef: string): void {
  if (!isHouseSession(orgRef)) {
    throw new ApiError("forbidden", "MAJ is house alpha.");
  }
}
