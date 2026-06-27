import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "./dynamo";
import { scorePkForUser, scoreSk } from "./keys";

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
