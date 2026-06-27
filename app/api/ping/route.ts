import { NextResponse} from "next/server";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import {ddb, TABLE} from "@/lib/dynamo"

export async function GET() {
    const item = { pk: "PING", sk: "PING", message: "hello dynamodb", at: new Date().toISOString()};
    await ddb.send(new PutCommand({ TableName: TABLE, Item: item}));
    const result = await ddb.send(new GetCommand({ TableName: TABLE, Key: { pk: "PING", sk: "PING"}}));
    return NextResponse.json({ ok: true, readBack: result.Item});
}