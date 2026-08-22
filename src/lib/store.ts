import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type Task = {
  id: string;
  title: string;
  owner: string;
  done: boolean;
  createdAt: string;
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "tasks.json");

const seed: Task[] = [
  {
    id: randomUUID(),
    title: "Boka mötesrum för styrelsemötet",
    owner: "Astrid",
    done: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: randomUUID(),
    title: "Skicka ut protokoll från förra veckan",
    owner: "Björn",
    done: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

async function readAll(): Promise<Task[]> {
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    return JSON.parse(raw) as Task[];
  } catch {
    await save(seed);
    return seed;
  }
}

async function save(tasks: Task[]): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(tasks, null, 2), "utf8");
}

function sortForDisplay(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) || b.createdAt.localeCompare(a.createdAt),
  );
}

export async function listTasks(): Promise<Task[]> {
  return sortForDisplay(await readAll());
}

export async function addTask(input: {
  title: string;
  owner?: string;
}): Promise<Task> {
  const tasks = await readAll();
  const task: Task = {
    id: randomUUID(),
    title: input.title.trim(),
    owner: (input.owner ?? "").trim() || "Ospecificerad",
    done: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  await save(tasks);
  return task;
}

export async function toggleTask(id: string): Promise<Task | null> {
  const tasks = await readAll();
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  task.done = !task.done;
  await save(tasks);
  return task;
}

export async function deleteTask(id: string): Promise<boolean> {
  const tasks = await readAll();
  const next = tasks.filter((t) => t.id !== id);
  if (next.length === tasks.length) return false;
  await save(next);
  return true;
}
