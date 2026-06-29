import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "./dynamo";
import { scorePkForUser, scoreSk } from "./keys";
import { allScorePks } from "./keys";

export interface LeaderBoardEntry {
  userId: string;
  displayName: string;
  score: number;
}

export interface SubmitScoreInput {
  appId: string;
  gameId: string;
  userId: string;
  displayName: string;
  score: number;
}

export async function submitScore(input: SubmitScoreInput): Promise<void> {
  const { appId, gameId, userId, displayName, score } = input;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: {
        pk: scorePkForUser(appId, gameId, userId), // one fixed shard per user
        sk: scoreSk(userId),
      },
      // SET overwrites these attributes on each call. We store score as a Number (GSI sorts by it numerically) and stamp time.
      UpdateExpression:
        "SET #s = :score, displayName = :name, updatedAt = :now",
      ExpressionAttributeNames: { "#s": "score" }, // "score" - alias to be safe
      ExpressionAttributeValues: {
        ":score": score, // a JS number -> DynamoDB Number
        ":name": displayName,
        ":now": new Date().toISOString(),
      },
    }),
  );
}

export async function getTopNForShard(shardPk: string, n: number ): Promise<LeaderBoardEntry[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "GSI1_ScoreByShard",
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: {":pk": shardPk},
      ScanIndexForward: false,
      Limit: n
    })
  );

  return (res.Items ?? []).map((item) => ({
    userId: String(item.sk).replace("USER#", ""),
    displayName: item.displayName,
    score: item.score,
  }));

}

export async function getTopN(appId: string, gameId: string, n = 10): Promise<LeaderBoardEntry[]>
{
  const pkList = allScorePks(appId, gameId);
  const perShard = await Promise.all(
    pkList.map((item) => getTopNForShard(item, n))
  );

  return perShard.flat().sort((a , b) => b.score - a.score).slice(0, n);

}
