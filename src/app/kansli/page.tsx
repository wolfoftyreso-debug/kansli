import Link from "next/link";
import { readSession } from "@/lib/auth/session";
import TaskBoard from "../TaskBoard";

export const metadata = {
  title: "Kansli — Pixdrift",
  description: "Internal hub. Sign in with your Pixdrift identity.",
};

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">
        K
      </span>
      <div className="flex flex-col leading-tight">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Kansli
        </h1>
        <span className="text-xs text-zinc-400">Pixdrift-nav</span>
      </div>
    </Link>
  );
}

export default async function KansliHub() {
  const session = await readSession();

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
        <header className="flex items-center justify-between gap-4">
          <Brand />
          {session ? (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Logga ut
              </button>
            </form>
          ) : (
            <a
              href="/api/auth/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Logga in med Pixdrift
            </a>
          )}
        </header>

        {session ? (
          <>
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {session.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {session.name}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{session.email}</span>
                </div>
              </div>

              {session.org && (
                <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Aktiv organisation:{" "}
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {session.org.name}
                    </span>{" "}
                    · roller: {session.org.roles.join(", ") || "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {session.org.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {session.memberships.length > 1 && (
                <p className="mt-3 text-xs text-zinc-400">
                  Du är medlem i {session.memberships.length} organisationer via samma
                  Pixdrift-identitet.
                </p>
              )}
            </section>

            <TaskBoard />
          </>
        ) : (
          <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Välkommen till kansliet
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Logga in med din Pixdrift-identitet för att se uppgiftstavlan. Samma inloggning gäller
              i alla Pixdrift-system.
            </p>
            <a
              href="/api/auth/login"
              className="self-start rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500"
            >
              Logga in med Pixdrift
            </a>
          </section>
        )}
      </main>
    </div>
  );
}
