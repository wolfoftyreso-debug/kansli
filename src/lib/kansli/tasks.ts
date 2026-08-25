import { randomUUID } from "node:crypto";
import type pg from "pg";

export interface Task {
  id: string;
  title: string;
  owner: string;
  done: boolean;
  createdAt: string;
}

export async function listTasks(pool: pg.Pool, orgRef: string): Promise<Task[]> {
  const { rows } = await pool.query<{
    id: string;
    title: string;
    owner: string;
    done: boolean;
    created_at: Date;
  }>(
    `select id, title, owner, done, created_at from kansli.tasks
      where org_ref = $1
      order by done asc, created_at desc`,
    [orgRef],
  );
  return rows.map(toTask);
}

export async function addTask(
  pool: pg.Pool,
  input: { orgRef: string; title: string; owner: string; createdBy: string },
): Promise<Task> {
  const id = randomUUID();
  const { rows } = await pool.query<{
    id: string;
    title: string;
    owner: string;
    done: boolean;
    created_at: Date;
  }>(
    `insert into kansli.tasks (id, org_ref, title, owner, created_by)
     values ($1,$2,$3,$4,$5)
     returning id, title, owner, done, created_at`,
    [id, input.orgRef, input.title.trim(), input.owner, input.createdBy],
  );
  return toTask(rows[0]!);
}

export async function toggleTask(pool: pg.Pool, orgRef: string, id: string): Promise<Task | null> {
  const { rows } = await pool.query<{
    id: string;
    title: string;
    owner: string;
    done: boolean;
    created_at: Date;
  }>(
    `update kansli.tasks set done = not done
      where id = $1 and org_ref = $2
      returning id, title, owner, done, created_at`,
    [id, orgRef],
  );
  return rows[0] ? toTask(rows[0]) : null;
}

export async function deleteTask(pool: pg.Pool, orgRef: string, id: string): Promise<boolean> {
  const { rowCount } = await pool.query(`delete from kansli.tasks where id = $1 and org_ref = $2`, [
    id,
    orgRef,
  ]);
  return (rowCount ?? 0) > 0;
}

function toTask(row: {
  id: string;
  title: string;
  owner: string;
  done: boolean;
  created_at: Date;
}): Task {
  return {
    id: row.id,
    title: row.title,
    owner: row.owner,
    done: row.done,
    createdAt: new Date(row.created_at).toISOString(),
  };
}
