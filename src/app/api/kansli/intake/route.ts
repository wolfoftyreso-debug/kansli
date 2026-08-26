import { NextResponse } from "next/server";
import { completeIntakeSubmit } from "@/lib/kansli/complete-intake";
import { intakeRevealCookie } from "@/lib/kansli/intake-reveal";

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return new NextResponse("Fel avsändare.", { status: 403 });
  }
  const form = await request.formData();
  let result: Awaited<ReturnType<typeof completeIntakeSubmit>>;
  try {
    result = await completeIntakeSubmit(form);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/stämmer inte|tio siffror|saknas/.test(message)) {
      return NextResponse.redirect(new URL("/upphandling?fel=orgnr", request.url), 303);
    }
    throw error;
  }
  const response = NextResponse.redirect(new URL(result.path, request.url), 303);
  if (result.reveal) {
    const cookie = await intakeRevealCookie(result.reveal);
    response.cookies.set(cookie);
  }
  return response;
}
