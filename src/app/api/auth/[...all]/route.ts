import { auth } from "../../../../lib/auth";
import { toNodeHandler } from "better-auth/node";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return auth.handler(req);
}

export async function POST(req: NextRequest) {
  return auth.handler(req);
}
