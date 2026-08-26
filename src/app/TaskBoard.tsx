"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, t, type Locale } from "@/lib/i18n";

type Task = {
  id: string;
  title: string;
  owner: string;
  done: boolean;
  createdAt: string;
};

export default function TaskBoard({
  highlightId,
  initialTasks = [],
  locale = DEFAULT_LOCALE,
}: {
  highlightId?: string | null;
  initialTasks?: Task[];
  locale?: Locale;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [loading, setLoading] = useState(false);
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
        if (active) setError(t(locale, "tasks.fetchError"));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [locale]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError(t(locale, "tasks.emptyTitle"));
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
        throw new Error(data.error ?? t(locale, "tasks.saveError"));
      }
      setTitle("");
      setOwner("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "tasks.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(id: string) {
    setError(null);
    const res = await fetch(`/api/kansli/tasks/${id}`, { method: "PATCH" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : t(locale, "tasks.updateError"));
      return;
    }
    await refresh();
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/kansli/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : t(locale, "tasks.deleteError"));
      return;
    }
    await refresh();
  }

  const { open, done } = useMemo(
    () => ({
      open: tasks.filter((item) => !item.done).length,
      done: tasks.filter((item) => item.done).length,
    }),
    [tasks],
  );

  return (
    <section className="flex flex-col gap-6">
      <p className="text-sm text-ink-soft">{t(locale, "tasks.summary", { open, done })}</p>

      <form
        onSubmit={addTask}
        className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t(locale, "tasks.titlePlaceholder")}
            aria-label={t(locale, "tasks.titleAria")}
            className="flex-1 border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-accent"
          />
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder={t(locale, "tasks.ownerPlaceholder")}
            aria-label={t(locale, "tasks.ownerAria")}
            className="border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-accent sm:w-40"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="self-start bg-ink px-4 py-2 font-medium text-paper hover:bg-ink-soft disabled:opacity-60"
        >
          {submitting ? t(locale, "common.saving") : t(locale, "tasks.add")}
        </button>
        {error && (
          <p role="alert" className="text-sm text-ink">
            {error}
          </p>
        )}
      </form>

      <div className="flex flex-col gap-2">
        {loading ? (
          <p className="text-ink-soft">{t(locale, "common.loading")}</p>
        ) : tasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">
            {t(locale, "tasks.empty")}
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
                  aria-label={t(locale, "tasks.markDone", { title: task.title })}
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
                  aria-label={t(locale, "tasks.removeNamed", { title: task.title })}
                  className="shrink-0 border border-transparent px-2 py-1 text-sm text-muted hover:border-[var(--color-status-blocked)] hover:bg-[var(--color-status-blocked)] hover:text-paper"
                >
                  {t(locale, "tasks.remove")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
