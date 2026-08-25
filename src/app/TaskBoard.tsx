"use client";

import { useEffect, useMemo, useState } from "react";

type Task = {
  id: string;
  title: string;
  owner: string;
  done: boolean;
  createdAt: string;
};

export default function TaskBoard({ highlightId }: { highlightId?: string | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/kansli/tasks", { cache: "no-store" });
    const data = await res.json();
    setTasks(data.tasks ?? []);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/kansli/tasks", { cache: "no-store" });
        const data = await res.json();
        if (active) setTasks(data.tasks ?? []);
      } catch {
        if (active) setError("Kunde inte hämta uppgifter.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Titeln får inte vara tom.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/kansli/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, owner }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Kunde inte spara uppgiften.");
      }
      setTitle("");
      setOwner("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(id: string) {
    setError(null);
    const res = await fetch(`/api/kansli/tasks/${id}`, { method: "PATCH" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Kunde inte uppdatera uppgiften.");
      return;
    }
    await refresh();
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/kansli/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Kunde inte ta bort uppgiften.");
      return;
    }
    await refresh();
  }

  const { open, done } = useMemo(
    () => ({
      open: tasks.filter((t) => !t.done).length,
      done: tasks.filter((t) => t.done).length,
    }),
    [tasks],
  );

  return (
    <section className="flex flex-col gap-6">
      <p className="text-sm text-ink-soft">
        Uppgiftstavla — {open} öppna, {done} klara.
      </p>

      <form
        onSubmit={addTask}
        className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ny uppgift…"
            aria-label="Uppgiftens titel"
            className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-accent"
          />
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Ansvarig"
            aria-label="Ansvarig"
            className="rounded-lg border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-accent sm:w-40"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-lg bg-accent px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Sparar…" : "Lägg till"}
        </button>
        {error && (
          <p role="alert" className="text-sm text-ink">
            {error}
          </p>
        )}
      </form>

      <div className="flex flex-col gap-2">
        {loading ? (
          <p className="text-ink-soft">Laddar…</p>
        ) : tasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">
            Inga uppgifter ännu. Lägg till den första ovan.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                id={`task-${task.id}`}
                className={
                  task.id === highlightId
                    ? "flex items-center gap-3 rounded-xl border border-line-strong bg-accent-soft p-4"
                    : "flex items-center gap-3 rounded-xl border border-line bg-surface p-4"
                }
              >
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggle(task.id)}
                  aria-label={`Markera "${task.title}" som klar`}
                  className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={`truncate font-medium ${
                      task.done ? "text-faint line-through" : "text-ink"
                    }`}
                  >
                    {task.title}
                  </span>
                  <span className="text-sm text-ink-soft">{task.owner}</span>
                </div>
                <button
                  onClick={() => remove(task.id)}
                  aria-label={`Ta bort "${task.title}"`}
                  className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted hover:text-danger"
                >
                  Ta bort
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
