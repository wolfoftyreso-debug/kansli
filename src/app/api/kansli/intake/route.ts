import { NextResponse } from "next/server";
import { completeIntakeSubmit } from "@/lib/kansli/complete-intake";
import { intakeRevealCookie } from "@/lib/kansli/intake-reveal";

function hostName(value: string): string {
  return value.replace(/:\d+$/, "").replace(/^localhost$/i, "127.0.0.1");
}

function requestBase(request: Request): string {
  return (
    request.headers.get("origin") ||
    `${new URL(request.url).protocol}//${request.headers.get("host") || new URL(request.url).host}`
  );
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const fromOrigin = hostName(new URL(origin).host);
    const fromRequest = hostName(request.headers.get("host") || new URL(request.url).host);
    return fromOrigin === fromRequest;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return new NextResponse("Wrong sender.", { status: 403 });
  }
  const form = await request.formData();
  let result: Awaited<ReturnType<typeof completeIntakeSubmit>>;
  try {
    result = await completeIntakeSubmit(form);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/minst en modul/.test(message)) {
      return NextResponse.redirect(new URL("/upphandling?fel=moduler", requestBase(request)), 303);
    }
    if (/stämmer inte|tio siffror|saknas|does not check out|ten digits|is missing/.test(message)) {
      return NextResponse.redirect(new URL("/upphandling?fel=orgnr", requestBase(request)), 303);
    }
    throw error;
  }
  const response = NextResponse.redirect(new URL(result.path, requestBase(request)), 303);
  if (result.reveal) {
    const cookie = await intakeRevealCookie(result.reveal);
    response.cookies.set(cookie);
  }
  return response;
}
