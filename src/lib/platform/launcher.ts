import { productModules, type SystemId } from "@pixdrift/systems";
import { FAMILY_SYSTEMS } from "./family.ts";
import { appPath } from "./paths.ts";

/** Categories for rooms that exist in this repo. Not the 14-name wish list. */
const CATEGORY: Record<Exclude<SystemId, "identity">, string> = {
  kansli: "Start",
  ekonomi: "Bok",
  tora: "Upphandling",
  rita: "Skatt",
  britt: "Uppföljning",
  irma: "Avtal",
  tyra: "Däckhotell",
  alva: "Diagnos",
  creditae: "Kredit",
};

export type LauncherTile = {
  id: Exclude<SystemId, "identity">;
  name: string;
  category: string;
  description: string;
  href: string;
  mark: string;
};

const BLOCKED_NAMES = ["nora", "mova", "saga", "nova", "carina", "maja", "mona", "lena", "academy"];

export function launcherTiles(): LauncherTile[] {
  return productModules().map((module) => {
    const family = FAMILY_SYSTEMS.find((system) => system.id === module.id);
    const id = module.id as Exclude<SystemId, "identity">;
    return {
      id,
      name: module.name,
      category: CATEGORY[id],
      description: family?.mission ?? module.purpose,
      href: appPath(module.id) ?? module.basePath,
      mark: module.name.slice(0, 1),
    };
  });
}

export function launcherForbiddenIds(): readonly string[] {
  return BLOCKED_NAMES;
}
