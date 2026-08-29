import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import { APP_ROBOTS_DISALLOW } from "../../app/robots.ts";
import {
  APP_ROOM_ROBOTS,
  APP_ROOM_ROBOTS_CONTENT,
  APP_ROOM_VIEWPORT_META,
  appRoomRobots,
  appRoomRobotsMeta,
} from "./app-robots.ts";

const HTML_ROOMS = SYSTEM_MODULES.filter((system) => system.id !== "identity").map(
  (system) => system.basePath,
);

describe("leftover app-room robots lock", () => {
  it("puts leftover HTML noindex on catalog rooms, platform and confirmation", () => {
    expect(appRoomRobots()).toEqual({ robots: APP_ROOM_ROBOTS });
    expect(APP_ROOM_ROBOTS).toEqual({ index: false, follow: false });
    for (const path of [...HTML_ROOMS, "/platform"]) {
      const file = `src/app${path}/layout.tsx`;
      expect(existsSync(file), file).toBe(true);
      expect(readFileSync(file, "utf8"), file).toContain("appRoomRobots");
    }
    expect(readFileSync("src/app/upphandling/bekraftelse/page.tsx", "utf8")).toContain(
      "appRoomRobots",
    );
    expect(readFileSync("src/app/irma/l/[token]/page.tsx", "utf8")).toContain("appRoomRobots");
    expect(readFileSync("src/app/tyra/hub/[token]/page.tsx", "utf8")).toContain("appRoomRobots");
    expect(APP_ROBOTS_DISALLOW).toContain("/idp");
    expect(APP_ROBOTS_DISALLOW).toContain("/api/");
    expect(existsSync("src/app/idp/layout.tsx")).toBe(false);
    expect(APP_ROOM_ROBOTS_CONTENT).toBe("noindex, nofollow");
    expect(appRoomRobotsMeta()).toBe(`<meta name="robots" content="${APP_ROOM_ROBOTS_CONTENT}">`);
    expect(readFileSync("packages/identity/src/server.ts", "utf8")).toContain(
      `content="${APP_ROOM_ROBOTS_CONTENT}"`,
    );
    expect(readFileSync("src/app/api/auth/login/route.ts", "utf8")).toContain("appRoomRobotsMeta");
    expect(APP_ROOM_VIEWPORT_META).toContain("width=device-width");
    expect(readFileSync("packages/identity/src/server.ts", "utf8")).toContain("IDP_HTML_VIEWPORT");
    expect(readFileSync("packages/identity/src/server.ts", "utf8")).toContain(
      APP_ROOM_VIEWPORT_META,
    );
    expect(readFileSync("src/app/api/auth/login/route.ts", "utf8")).toContain(
      "APP_ROOM_VIEWPORT_META",
    );
  });

  it("leaves leftover public site and intake form out of HTML noindex", () => {
    expect(readFileSync("src/app/(site)/layout.tsx", "utf8")).not.toContain("appRoomRobots");
    expect(readFileSync("src/app/(site)/company/page.tsx", "utf8")).not.toContain("appRoomRobots");
    expect(readFileSync("src/app/upphandling/page.tsx", "utf8")).not.toContain("appRoomRobots");
    expect(readFileSync("src/app/upphandling/page.tsx", "utf8")).not.toContain("noindex");
    expect(APP_ROBOTS_DISALLOW).not.toContain("/upphandling");
    expect(APP_ROBOTS_DISALLOW).not.toContain("/documentation");
  });
});
