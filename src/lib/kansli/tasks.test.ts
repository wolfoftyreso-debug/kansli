import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { addTask, deleteTask, listTasks, toggleTask } from "./tasks.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("kansli.tasks (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "kansli-tasks-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("scopes tasks to the organisation and toggles without touching others", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const orgRef = `pixdrift:org:kansli-${Date.now()}`;
    const other = `${orgRef}-other`;

    const created = await addTask(pool, {
      orgRef,
      title: "Granska TORA-publicering",
      owner: "Demo",
      createdBy: "user-test",
    });
    await addTask(pool, {
      orgRef: other,
      title: "Annan org",
      owner: "X",
      createdBy: "user-other",
    });

    const listed = await listTasks(pool, orgRef);
    expect(listed.map((task) => task.id)).toEqual([created.id]);
    expect(listed[0]?.done).toBe(false);

    const toggled = await toggleTask(pool, orgRef, created.id);
    expect(toggled?.done).toBe(true);
    expect(await toggleTask(pool, other, created.id)).toBeNull();

    expect(await deleteTask(pool, other, created.id)).toBe(false);
    expect(await deleteTask(pool, orgRef, created.id)).toBe(true);
    expect(await listTasks(pool, orgRef)).toEqual([]);
  });
});
