import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import { APP_ROBOTS_DISALLOW } from "../../app/robots.ts";
import {
  APP_ROOM_ROBOTS,
  APP_ROOM_ROBOTS_CONTENT,
  APP_ROOM_VIEWPORT_META,
  APP_ROOM_X_ROBOTS_EXTRA,
  APP_ROOM_X_ROBOTS_PATHS,
  appRoomRobots,
  appRoomRobotsMeta,
  appRoomXRobotsHeaders,
  leftoverXRobotsSource,
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

  it("puts leftover X-Robots-Tag on leftover rooms, not leftover public HTML", () => {
    expect([...APP_ROOM_X_ROBOTS_PATHS]).toEqual([
      ...APP_ROBOTS_DISALLOW,
      ...APP_ROOM_X_ROBOTS_EXTRA,
    ]);
    const headers = appRoomXRobotsHeaders();
    const sources = headers.map((entry) => entry.source);
    for (const path of APP_ROBOTS_DISALLOW) {
      expect(sources, path).toContain(leftoverXRobotsSource(path));
    }
    expect(APP_ROOM_X_ROBOTS_EXTRA).toEqual(["/upphandling/bekraftelse"]);
    expect(sources).toContain("/upphandling/bekraftelse/:path*");
    expect(sources).toContain("/ekonomi/:path*");
    expect(sources).toContain("/idp/:path*");
    expect(sources).toContain("/api/:path*");
    expect(sources).not.toContain("/upphandling/:path*");
    expect(sources).not.toContain("/documentation/:path*");
    expect(sources).not.toContain("/systems/:path*");
    expect(sources).not.toContain("/why/:path*");
    expect(sources).not.toContain("/company/:path*");
    expect(sources).not.toContain("/:path*");
    for (const entry of headers) {
      expect(entry.headers).toEqual([{ key: "X-Robots-Tag", value: APP_ROOM_ROBOTS_CONTENT }]);
    }
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(nextConfig).toContain("appRoomXRobotsHeaders");
    expect(nextConfig).not.toMatch(/source:\s*"\/:path\*"[^]*X-Robots-Tag/);
  });
});
