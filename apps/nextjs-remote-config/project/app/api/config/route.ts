import { NextResponse } from "next/server";
import { getRemoteConfig } from "../../../src/revisium/config-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getRemoteConfig();
  return NextResponse.json(config);
}
