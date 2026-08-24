/**
 * The boundary to the analysis engine.
 *
 * One interface, three implementations, and nothing above this package knows
 * which is in use. `SubprocessAnalysisEngine` runs the real binary locally;
 * `HttpAnalysisEngine` is the production path (Vercel-first product, real Rust
 * engine hosted as an HTTP service); `FakeAnalysisEngine` is for tests only
 * and must never be wired outside `local`/`test`.
 */

import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { access, constants } from "node:fs/promises";
import {
  AnalysisEnvelope,
  ContractVersionMismatch,
  SUPPORTED_CONTRACT_VERSION,
  type EngineRequest,
} from "./contract.ts";
import { subprocessEngineEnv } from "./subprocess-env.ts";

export interface AnalysisEngine {
  /** Version string, for the health check and for stamping a run. */
  version(): Promise<EngineVersion>;
  analyse(request: EngineRequest, options?: AnalyseOptions): Promise<AnalysisEnvelope>;
}

export interface EngineVersion {
  readonly engineVersion: string;
  readonly ruleSetVersion: string;
  readonly contractVersion: string;
}

export interface AnalyseOptions {
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

export class EngineError extends Error {
  constructor(
    message: string,
    readonly code: EngineErrorCode,
    readonly detail?: string,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

export type EngineErrorCode =
  "engineMissing" | "engineTimeout" | "engineFailed" | "engineUnreadable" | "contractMismatch";

// ---------------------------------------------------------------------------
// Subprocess
// ---------------------------------------------------------------------------

export interface SubprocessOptions {
  readonly binaryPath: string;
  readonly timeoutMs: number;
  /**
   * Environment for the child. Deliberately not `process.env`: the engine
   * needs `ANTHROPIC_API_KEY` and a locale, and passing everything else would
   * hand a subprocess the database password for no reason.
   */
  readonly env?: NodeJS.ProcessEnv;
  readonly cwd?: string;
}

export class SubprocessAnalysisEngine implements AnalysisEngine {
  constructor(private readonly options: SubprocessOptions) {}

  /**
   * Fails fast at boot if the binary is absent or not executable.
   *
   * Called from the worker's startup rather than left to the first scan: a
   * deployment that forgot to build the engine should refuse to start, not
   * accept work it cannot do and fail it one job at a time.
   */
  async assertAvailable(): Promise<EngineVersion> {
    try {
      await access(this.options.binaryPath, constants.X_OK);
    } catch {
      throw new EngineError(
        `analysmotorn finns inte eller är inte körbar: ${this.options.binaryPath}. ` +
          `Kör \`pnpm engine:build\`.`,
        "engineMissing",
      );
    }
    return this.version();
  }

  async version(): Promise<EngineVersion> {
    const { stdout } = await this.run(["--version"], null, 15_000);
    // `skattjakt-analyze 0.1.0 regelverk se-2025.1 kontrakt 1`
    const match = /^skattjakt-analyze (\S+) regelverk (\S+) kontrakt (\S+)/.exec(stdout.trim());
    if (!match) {
      throw new EngineError(
        `oväntat svar från --version: ${stdout.trim().slice(0, 200)}`,
        "engineUnreadable",
      );
    }
    return {
      engineVersion: match[1]!,
      ruleSetVersion: match[2]!,
      contractVersion: match[3]!,
    };
  }

  async analyse(request: EngineRequest, options: AnalyseOptions = {}): Promise<AnalysisEnvelope> {
    const timeoutMs = options.timeoutMs ?? this.options.timeoutMs;
    const { stdout, stderr } = await this.run(
      ["--request", "-", "--emit", "result"],
      JSON.stringify(request),
      timeoutMs,
      options.signal,
    );

    let parsed: unknown;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      throw new EngineError(
        "motorn svarade med något som inte är JSON",
        "engineUnreadable",
        // stderr carries the engine's own Swedish diagnostics, which is the
        // useful half when stdout is unparseable.
        stderr.slice(0, 2_000),
      );
    }

    return parseEnvelope(parsed);
  }

  private run(
    args: readonly string[],
    stdin: string | null,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.options.binaryPath, [...args], {
        cwd: this.options.cwd,
        env: this.options.env ?? subprocessEngineEnv(),
        stdio: ["pipe", "pipe", "pipe"],
      }) as ChildProcessWithoutNullStreams;

      let stdout = "";
      let stderr = "";
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill("SIGKILL");
        reject(
          new EngineError(
            `analysen översteg tidsgränsen på ${timeoutMs} ms`,
            "engineTimeout",
            stderr.slice(0, 2_000),
          ),
        );
      }, timeoutMs);

      const onAbort = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        child.kill("SIGKILL");
        reject(new EngineError("analysen avbröts", "engineFailed"));
      };
      signal?.addEventListener("abort", onAbort, { once: true });

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });

      child.on("error", (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        reject(
          new EngineError(`analysmotorn kunde inte startas: ${error.message}`, "engineMissing"),
        );
      });

      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        if (code !== 0) {
          reject(
            new EngineError(
              // The engine writes an actionable Swedish sentence to stderr and
              // exits 1. Surfacing it beats "exit code 1".
              stderr.trim().split("\n").at(-1) ?? `analysen misslyckades (kod ${code})`,
              "engineFailed",
              stderr.slice(0, 2_000),
            ),
          );
          return;
        }
        resolve({ stdout, stderr });
      });

      if (stdin !== null) {
        child.stdin.end(stdin, "utf8");
      } else {
        child.stdin.end();
      }
    });
  }
}

/**
 * Validates an envelope and checks the contract version.
 *
 * Exported so the fake and the tests use exactly the same parse the subprocess
 * does — a fake that skipped validation would let the product layer depend on
 * a shape the real engine never produces.
 */
export function parseEnvelope(value: unknown): AnalysisEnvelope {
  const version =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)["contract_version"]
      : undefined;
  if (typeof version === "string" && version !== SUPPORTED_CONTRACT_VERSION) {
    throw new ContractVersionMismatch(version);
  }

  const parsed = AnalysisEnvelope.safeParse(value);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new EngineError(
      `motorns svar matchar inte kontraktet: ${first?.path.join(".") ?? "(rot)"} — ${first?.message ?? "okänt fel"}`,
      "contractMismatch",
      JSON.stringify(parsed.error.issues.slice(0, 5)),
    );
  }
  return parsed.data;
}

// ---------------------------------------------------------------------------
// Fake
// ---------------------------------------------------------------------------

/**
 * A deterministic engine for tests and for a local run without Rust.
 *
 * Named `Fake`, not `Mock` or `Default`, and constructed only where a test or
 * an explicitly non-production configuration asks for it. The brief is firm
 * that a fake must never look like a real integration in a production flow;
 * the API refuses to start with this wired in outside `local` and `test`.
 */
export class FakeAnalysisEngine implements AnalysisEngine {
  private readonly envelopes: AnalysisEnvelope[];
  private index = 0;
  readonly requests: EngineRequest[] = [];

  constructor(envelopes: readonly unknown[]) {
    if (envelopes.length === 0) throw new Error("FakeAnalysisEngine behöver minst ett kuvert");
    this.envelopes = envelopes.map(parseEnvelope);
  }

  async version(): Promise<EngineVersion> {
    const first = this.envelopes[0]!;
    return {
      engineVersion: `${first.engine_version}-fake`,
      ruleSetVersion: first.rule_set_version,
      contractVersion: first.contract_version,
    };
  }

  async analyse(request: EngineRequest): Promise<AnalysisEnvelope> {
    this.requests.push(request);
    // Successive calls walk the list and then hold on the last, so a test of
    // "re-run after answering a question" scripts two different results
    // without having to count calls.
    const envelope = this.envelopes[Math.min(this.index, this.envelopes.length - 1)]!;
    this.index += 1;
    // The caller's ids come back, as the real engine does, so a test cannot
    // pass by accident against a fake that ignored them. Document ids are
    // rewritten too: the real engine echoes the ones it was given, and a fake
    // that kept the fixture's would produce evidence pointing at documents the
    // caller has never heard of — which passed as a test and failed in the
    // worker's foreign key.
    return rewriteIds(envelope, request);
  }
}

// ---------------------------------------------------------------------------
// HTTP (production host)
// ---------------------------------------------------------------------------

export interface HttpEngineOptions {
  /** Origin of the engine service, no trailing slash. */
  readonly baseUrl: string;
  /** Shared secret; the engine refuses unauthenticated analyse calls. */
  readonly token: string;
  readonly timeoutMs?: number;
  readonly fetch?: typeof fetch;
}

/**
 * Calls the real analysis engine over HTTP.
 *
 * This is the Vercel-first production adapter: the product (Route Handlers,
 * Cron) stays on Vercel; the Rust binary (`skattjakt`) stays the source of
 * findings. The host is justified because a Vercel Node Function cannot
 * execute that binary (constitution art. 4).
 *
 * The request/response is the same JSON contract the subprocess already uses.
 * A WASM or TypeScript engine would be another class here — not a change
 * above this package.
 */
export class HttpAnalysisEngine implements AnalysisEngine {
  constructor(private readonly options: HttpEngineOptions) {
    if (!options.baseUrl) throw new EngineError("ENGINE_URL saknas", "engineMissing");
    if (!options.token) throw new EngineError("ENGINE_TOKEN saknas", "engineMissing");
  }

  async version(): Promise<EngineVersion> {
    const payload = await this.call("GET", "/version", null, 15_000);
    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof (payload as Record<string, unknown>)["engineVersion"] !== "string"
    ) {
      throw new EngineError("motorn svarade inte med en version", "engineUnreadable");
    }
    const body = payload as Record<string, unknown>;
    return {
      engineVersion: String(body["engineVersion"]),
      ruleSetVersion: String(body["ruleSetVersion"] ?? ""),
      contractVersion: String(body["contractVersion"] ?? ""),
    };
  }

  async analyse(request: EngineRequest, options: AnalyseOptions = {}): Promise<AnalysisEnvelope> {
    const timeoutMs = options.timeoutMs ?? this.options.timeoutMs ?? 180_000;
    const payload = await this.call("POST", "/analyse", request, timeoutMs, options.signal);
    return parseEnvelope(payload);
  }

  private async call(
    method: "GET" | "POST",
    pathname: string,
    body: unknown,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const fetchFn = this.options.fetch ?? fetch;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort, { once: true });

    try {
      const response = await fetchFn(`${this.options.baseUrl.replace(/\/$/, "")}${pathname}`, {
        method,
        headers: {
          authorization: `Bearer ${this.options.token}`,
          accept: "application/json",
          ...(body !== null ? { "content-type": "application/json" } : {}),
        },
        body: body === null ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      const text = await response.text();
      if (!response.ok) {
        throw new EngineError(
          `analysmotorn svarade ${response.status}`,
          response.status === 404 ? "engineMissing" : "engineFailed",
          text.slice(0, 2_000),
        );
      }

      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new EngineError(
          "motorn svarade med något som inte är JSON",
          "engineUnreadable",
          text.slice(0, 2_000),
        );
      }
    } catch (error) {
      if (error instanceof EngineError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new EngineError(`analysen översteg tidsgränsen på ${timeoutMs} ms`, "engineTimeout");
      }
      throw new EngineError(
        `analysmotorn kunde inte nås: ${error instanceof Error ? error.message : String(error)}`,
        "engineMissing",
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }
}

/**
 * Points a fixture envelope at the caller's own ids.
 *
 * The real engine carries `document_id` and `document_version_id` straight
 * through from the request into every `DocumentValue` evidence item. A fake
 * that did not would let a test pass while the production path failed on a
 * foreign key — which is exactly what happened before this existed.
 */
function rewriteIds(envelope: AnalysisEnvelope, request: EngineRequest): AnalysisEnvelope {
  const rewritten = structuredClone(envelope);
  const wanted = request.documents[0];

  rewritten.analysis_id = request.analysis_id;
  rewritten.company_id = request.company.id;

  if (wanted) {
    for (const record of rewritten.documents) {
      record.document_id = wanted.document_id;
      record.document_version_id = wanted.document_version_id;
    }
    const groups = [rewritten.result.opportunities, rewritten.result.rejected];
    for (const group of groups) {
      for (const opportunity of group) {
        for (const item of opportunity.evidence) {
          if (item.type !== "document_value") continue;
          item.document_id = wanted.document_id;
          item.document_version_id = wanted.document_version_id;
        }
      }
    }
  }

  return rewritten;
}
