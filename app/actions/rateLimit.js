'use server'

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const getDynamoDb = () => {
  const client = new DynamoDBClient({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_REGION,
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
};

export async function checkRateLimit(identifier, limit = 30, windowMs = 300000) { // 30 requests per 5 minutes
  const dynamoDb = getDynamoDb();
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    const params = {
      TableName: "CharityTable2",
      Key: {
        PK: `RATELIMIT#${identifier}`,
        SK: "COUNTER"
      }
    };

    const result = await dynamoDb.send(new GetCommand(params));
    const record = result.Item;

    if (record) {
      // Clean up old timestamps and get current count
      const requests = record.timestamps.filter(timestamp => timestamp > windowStart);
      
      if (requests.length >= limit) {
        console.warn(`Rate limit exceeded for ${identifier}: ${requests.length} requests in ${windowMs}ms`);
        return {
          allowed: false,
          remaining: 0,
          resetAt: windowStart + windowMs
        };
      }

      // Add new timestamp
      requests.push(now);

      await dynamoDb.send(new PutCommand({
        TableName: "CharityTable2",
        Item: {
          PK: `RATELIMIT#${identifier}`,
          SK: "COUNTER",
          timestamps: requests,
          updatedAt: now
        }
      }));

      return {
        allowed: true,
        remaining: limit - requests.length,
        resetAt: windowStart + windowMs
      };
    } else {
      // First request
      await dynamoDb.send(new PutCommand({
        TableName: "CharityTable2",
        Item: {
          PK: `RATELIMIT#${identifier}`,
          SK: "COUNTER",
          timestamps: [now],
          updatedAt: now
        }
      }));

      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs
      };
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    // In case of error, allow the request but log the error
    return {
      allowed: true,
      remaining: null,
      resetAt: null,
      error: error.message
    };
  }
}
