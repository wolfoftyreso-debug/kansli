import type { Metadata } from "next";
import Link from "next/link";
import { FAMILY_STATUS_LABEL, FAMILY_SYSTEMS } from "@/lib/platform/family";
import { appPath } from "@/lib/platform/paths";

export const metadata: Metadata = {
  title: "PIXDRIFT",
  description: "Ett rum per jobb. Samma inloggning.",
};

export default function HomePage() {
  const rooms = FAMILY_SYSTEMS.filter((system) => system.id !== "identity");
  return (
    <>
      <header className="flex flex-col gap-2 border-b border-line pb-4">
        <p className="pd-label">PIXDRIFT</p>
        <h1 className="text-2xl font-semibold tracking-tight">Systemet</h1>
        <p className="max-w-xl text-sm text-ink-soft">
          Ett rum per jobb. Samma inloggning. Inget visningslager ovanpå — det här är ytan.
        </p>
      </header>

      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Rum i systemet</caption>
        <thead>
          <tr className="border-b border-line text-left">
            <th className="pd-label py-2 font-normal">Rum</th>
            <th className="pd-label py-2 font-normal">Läge</th>
            <th className="pd-label hidden py-2 font-normal sm:table-cell">Jobb</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((system) => {
            const href = appPath(system.id) ?? "/kansli";
            return (
              <tr key={system.id} className="border-b border-line">
                <td className="py-2.5 pr-4">
                  <Link href={href} className="font-medium text-ink hover:underline">
                    {system.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-ink-soft">{FAMILY_STATUS_LABEL[system.status]}</td>
                <td className="hidden py-2.5 text-ink-soft sm:table-cell">{system.mission}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-sm text-ink-soft">
        <Link href="/kansli" className="underline decoration-line underline-offset-4">
          Öppna Kansli
        </Link>
        {" · "}
        <Link href="/documentation" className="underline decoration-line underline-offset-4">
          Dokumentation
        </Link>
      </p>
    </>
  );
}
