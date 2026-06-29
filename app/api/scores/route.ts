import { NextResponse, NextRequest} from "next/server";
import { submitScore } from "../../../lib/leaderboard";
import { getTopN } from "../../../lib/leaderboard";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const {appId, gameId, userId, displayName, score} = body;

    if(!appId || !gameId || !userId || typeof score !== "number")
        return NextResponse.json({error: "missing or invalid fields"}, {status: 400});

    await submitScore({appId, gameId, userId, displayName: displayName ?? userId, score});
    return NextResponse.json({ ok: true});
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get("appId");
  const gameId = searchParams.get("gameId");
  const n = Number(searchParams.get("n") ?? 10);

  if (!appId || !gameId) {
    return NextResponse.json({ error: "appId and gameId required" }, { status: 400 });
  }

  const leaderboard = await getTopN(appId, gameId, n);
  return NextResponse.json({ leaderboard });

}