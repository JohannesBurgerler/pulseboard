// DynamoDB key construction

export const SHARD_COUNT = 10;

// We are using deterministic sharding for users. Meaning the same userID always maps to the same shard, so a player's score lives in exactly one item.

export function shardFor(userId: string, n = SHARD_COUNT): number {
  let h = 0;
  for (let i = 0; i < userId.length; i++)
    h = (h * 31 + userId.charCodeAt(i)) | 0; // "| 0" runs every loop, always truncating h to a signed 32-bit integer (mimics Java int overflow)
  return Math.abs(h) % n;
}


// Score items for a specific shard of a game and app
export const scorePk = (appId: string, gameId: string, shard: number) => `APP#${appId}#GAME#${gameId}#SHARD#${shard}`;

// the sort key that pins one specific player inside a shard partition (PK locates the shard, SK locates the user within it)
export const scoreSk = (userId: string) => `USER#${userId}`;

// gets the partition key that a user's score lives in
export const scorePkForUser = (appId:string,gameId:string,userId:string) => scorePk(appId, gameId, shardFor(userId));

// gets a list of partition keys which contain scores for each shard
export const allScorePks = (appId: string, gameId: string) => Array.from({ length: SHARD_COUNT }, (_, s) => scorePk(appId, gameId, s))