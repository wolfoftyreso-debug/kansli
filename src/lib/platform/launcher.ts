import { productModules, type SystemId } from "@pixdrift/systems";
import { DEFAULT_LOCALE, t, type Locale, type MessageKey } from "@/lib/i18n";
import { FAMILY_SYSTEMS } from "./family.ts";
import { appPath } from "./paths.ts";

/** Categories for rooms that exist in this repo. Not the 14-name wish list. */
const CATEGORY: Record<Exclude<SystemId, "identity">, MessageKey> = {
  kansli: "category.kansli",
  ekonomi: "category.ekonomi",
  tora: "category.tora",
  rita: "category.rita",
  britt: "category.britt",
  irma: "category.irma",
  tyra: "category.tyra",
  alva: "category.alva",
  creditae: "category.creditae",
};

const MISSION: Record<Exclude<SystemId, "identity">, MessageKey> = {
  kansli: "family.kansli.mission",
  ekonomi: "family.ekonomi.mission",
  tora: "family.tora.mission",
  rita: "family.rita.mission",
  britt: "family.britt.mission",
  irma: "family.irma.mission",
  tyra: "family.tyra.mission",
  alva: "family.alva.mission",
  creditae: "family.creditae.mission",
};

export type LauncherTile = {
  id: Exclude<SystemId, "identity">;
  name: string;
  category: string;
  description: string;
  href: string;
};

const BLOCKED_NAMES = [
  "nora",
  "mova",
  "saga",
  "nova",
  "carina",
  "maja",
  "mona",
  "lena",
  "academy",
  "bea",
];

export function launcherTiles(locale: Locale = DEFAULT_LOCALE): LauncherTile[] {
  return productModules().map((module) => {
    const family = FAMILY_SYSTEMS.find((system) => system.id === module.id);
    const id = module.id as Exclude<SystemId, "identity">;
    return {
      id,
      name: module.name,
      category: t(locale, CATEGORY[id]),
      description: t(locale, MISSION[id]) || family?.mission || module.purpose,
      href: appPath(module.id) ?? module.basePath,
    };
  });
}

export function launcherForbiddenIds(): readonly string[] {
  return BLOCKED_NAMES;
}
