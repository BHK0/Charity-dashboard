'use server'

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

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

export const getAllOrganizations = unstable_cache(
  async () => {
    const dynamoDb = getDynamoDb();
    const params = {
      TableName: "CharityTable2",
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": "ADMIN",
        ":sk": "ORG#"
      }
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    return result.Items;
  },
  ['organizations', 'list'],
  { 
    tags: ['organizations'],
    revalidate: 3000, 
  }
);

export const getOrganizationByUrl = unstable_cache(
  async (customUrl) => {
    const dynamoDb = getDynamoDb();
    const params = {
      TableName: "CharityTable2",
      IndexName: "CustomUrlIndex",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `URL#${customUrl}`
      }
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    return result.Items?.[0] || null;
  },
  (customUrl) => ['organizations', 'by-url', customUrl], // Dynamic cache key
  { 
    tags: ['organizations'],
    revalidate: 3000, 
  }
);

export async function createOrganization(orgData) {
  const dynamoDb = getDynamoDb();
  const orgId = Date.now().toString();
  
  const orgParams = {
    TableName: "CharityTable2",
    Item: {
      PK: "ADMIN",
      SK: `ORG#${orgId}`,
      GSI1PK: `URL#${orgData.customUrl}`,
      GSI1SK: `ORG#${orgId}`,
      customUrl: orgData.customUrl,
      name: orgData.name,
      logo: orgData.logo,
      colors: orgData.colors,
      donationChoices: orgData.donationChoices || [30, 60, 120],
      defaultChoices: orgData.defaultChoices || true,
      createdAt: new Date().toISOString(),
      totalDonations: 0,
      donationCount: 0
    }
  };

  await dynamoDb.send(new PutCommand(orgParams));
  revalidateTag('organizations');
  return orgId;
}

export async function updateOrganization(orgId, updates) {
  const dynamoDb = getDynamoDb();
  const params = {
    TableName: "CharityTable2",
    Key: {
      PK: "ADMIN",
      SK: `ORG#${orgId}`
    },
    UpdateExpression: "SET donationChoices = :choices, #name = :name, customUrl = :customUrl, GSI1PK = :gsi1pk, logo = :logo",
    ExpressionAttributeValues: {
      ":choices": updates.donationChoices,
      ":name": updates.name,
      ":customUrl": updates.customUrl,
      ":gsi1pk": `URL#${updates.customUrl}`,
      ":logo": updates.logo
    },
    ExpressionAttributeNames: {
      "#name": "name"
    }
  };

  await dynamoDb.send(new UpdateCommand(params));
  revalidateTag('organizations');
  return { success: true };
}

export async function deleteOrganization(orgId) {
  const dynamoDb = getDynamoDb();
  const params = {
    TableName: "CharityTable2",
    Key: {
      PK: "ADMIN",
      SK: `ORG#${orgId}`
    }
  };

  await dynamoDb.send(new DeleteCommand(params));
  revalidateTag('organizations');
  return { success: true };
}

// Add new action for optimistic updates
export async function createOrganizationWithOptimistic(formData) {
  try {
    const orgId = await createOrganization(formData);
    
    // Return the complete organization object for optimistic UI
    return {
      success: true,
      organization: {
        PK: "ADMIN",
        SK: `ORG#${orgId}`,
        GSI1PK: `URL#${formData.customUrl}`,
        GSI1SK: `ORG#${orgId}`,
        customUrl: formData.customUrl,
        name: formData.name,
        logo: formData.logo,
        colors: formData.colors,
        donationChoices: formData.donationChoices || [30, 60, 120],
        defaultChoices: formData.defaultChoices || true,
        createdAt: new Date().toISOString(),
        totalDonations: 0,
        donationCount: 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
