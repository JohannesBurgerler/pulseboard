import { NextResponse, NextRequest} from "next/server";
import { submitScore } from "../../../lib/leaderboard";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const {appId, gameId, userId, displayName, score} = body;

    if(!appId || !gameId || !userId || typeof score !== "number")
        return NextResponse.json({error: "missing or invalid fields"}, {status: 400});

    await submitScore({appId, gameId, userId, displayName: displayName ?? userId, score});
    return NextResponse.json({ ok: true});
};