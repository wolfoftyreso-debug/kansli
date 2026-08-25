import { handlePixdriftMcp } from "@/lib/mcp/handle";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handlePixdriftMcp(request);
}

export async function POST(request: Request) {
  return handlePixdriftMcp(request);
}

export async function OPTIONS(request: Request) {
  return handlePixdriftMcp(request);
}
